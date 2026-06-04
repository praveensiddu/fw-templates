import ipaddress
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import ValidationError
from backend.models import SaveItemRequest
from backend.services.addresses_service import AddressesService
from backend.services.common_service import (
    build_address_used_in_rule_metadata,
    build_fortimgr_matched_groups_for_env,
    build_group_used_in_group_metadata,
    build_group_used_in_rule_metadata,
    get_generated_folder_prefix,
    get_product_templates_repo_name,
    get_product_generated_repo_name,
    read_existing_addresses,
    read_existing_group_names,
    read_fortimgr_addrs_for_env,
    cleanup_address_not_used_by_product,
)
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_fwconfigfiles_root, get_settings_yaml_path
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict


@log_all_methods()
class IpInventoryService:
    _FILENAME = "ip_inventory.yaml"

    def __init__(self, product: Optional[str] = None):
        self._product = product

    @staticmethod
    def _normalize_env(env: str) -> str:
        v = str(env or "").strip().lower()
        if not v:
            raise ValidationError("env", "is required")
        return v

    def _validate_env_exists(self, env: str) -> None:
        e = self._normalize_env(env)
        env_path = get_settings_yaml_path("env.yaml")
        raw = read_yaml_dict(env_path)
        if not isinstance(raw, dict) or not raw:
            return
        if e not in raw:
            raise ValidationError("env", f"unknown env '{e}'")

    def _repo_root(self) -> Path:
        if not str(self._product or "").strip():
            return get_fwconfigfiles_root(None)
        repo_name = get_product_templates_repo_name(product=str(self._product or ""))
        return get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name

    def _path(self, *, env: str) -> Path:
        e = self._normalize_env(env)
        root = self._repo_root() / "ip_inventory" / e
        root.mkdir(parents=True, exist_ok=True)
        return root / self._FILENAME

    @staticmethod
    def _normalize_key(value: Any) -> str:
        v = str(value or "").strip()
        if not v:
            raise ValidationError("name", "is required")

        # Determine format by delimiter.
        if "-" in v:
            parts = [p.strip() for p in v.split("-", 1)]
            if len(parts) != 2 or not parts[0] or not parts[1]:
                raise ValidationError("name", "must be in format '<ip>-<ip>'")
            try:
                ip_start = ipaddress.ip_address(parts[0])
                ip_end = ipaddress.ip_address(parts[1])
            except Exception:
                raise ValidationError("name", "range must contain valid IP addresses")
            if ip_start.version != ip_end.version:
                raise ValidationError("name", "range start and end IP versions must match")
            if int(ip_start) > int(ip_end):
                raise ValidationError("name", "range start IP must be <= end IP")
            return f"{parts[0]}-{parts[1]}"

        if "/" in v:
            try:
                # strict=False allows host bits but validates CIDR syntax.
                ipaddress.ip_network(v, strict=False)
            except Exception:
                raise ValidationError("name", "must be a valid CIDR like '1.1.1.1/24'")
            return v

        try:
            ipaddress.ip_address(v)
        except Exception:
            raise ValidationError("name", "must be a valid IP address")
        return v

    @staticmethod
    def _to_ip_range_from_inventory_key(value: str) -> Tuple[int, int, int]:
        v = str(value or "").strip()
        if not v:
            raise ValidationError("ip_inventory", "empty entry")

        if "-" in v:
            parts = [p.strip() for p in v.split("-", 1)]
            if len(parts) != 2 or not parts[0] or not parts[1]:
                raise ValidationError("ip_inventory", "invalid range")
            start = ipaddress.ip_address(parts[0])
            end = ipaddress.ip_address(parts[1])
            if start.version != end.version:
                raise ValidationError("ip_inventory", "range start/end versions must match")
            return (int(start), int(end), start.version)

        if "/" in v:
            net = ipaddress.ip_network(v, strict=False)
            return (int(net.network_address), int(net.broadcast_address), net.version)

        ip = ipaddress.ip_address(v)
        return (int(ip), int(ip), ip.version)

    @staticmethod
    def _to_ip_range_from_fortimgr_value(value: Any) -> Tuple[int, int, int, str]:
        v = str(value or "").strip()
        if not v:
            raise ValidationError("fortimgr", "empty value")

        if "-" in v:
            parts = [p.strip() for p in v.split("-", 1)]
            if len(parts) != 2 or not parts[0] or not parts[1]:
                raise ValidationError("fortimgr", "invalid range")
            start = ipaddress.ip_address(parts[0])
            end = ipaddress.ip_address(parts[1])
            if start.version != end.version:
                raise ValidationError("fortimgr", "range start/end versions must match")
            return (int(start), int(end), start.version, f"{parts[0]}-{parts[1]}")

        # subnet with netmask: "1.1.1.0 255.255.255.240"
        parts = [p for p in v.split() if p]
        if len(parts) == 2:
            try:
                ip0 = ipaddress.ip_address(parts[0])
                mask = ipaddress.ip_address(parts[1])
                if ip0.version != 4 or mask.version != 4:
                    raise Exception("only IPv4 netmask supported")
                net = ipaddress.IPv4Network((str(ip0), str(mask)), strict=False)
                return (int(net.network_address), int(net.broadcast_address), 4, str(net))
            except Exception:
                # fallthrough to single IP
                pass

        ip = ipaddress.ip_address(v)
        return (int(ip), int(ip), ip.version, str(ip))

    @staticmethod
    def _ranges_overlap(a: Tuple[int, int, int], b: Tuple[int, int, int]) -> bool:
        a0, a1, av = a
        b0, b1, bv = b
        if av != bv:
            return False
        return not (a1 < b0 or b1 < a0)

    @staticmethod
    def _fortimgr_value_to_address_data(value_str: str) -> Dict[str, Any]:
        v = str(value_str or "").strip()
        if "-" in v:
            return {"range": v}
        if "/" in v:
            return {"subnet": v}
        parts = [p for p in v.split() if p]
        if len(parts) == 2:
            try:
                net = ipaddress.IPv4Network((parts[0], parts[1]), strict=False)
                return {"subnet": str(net)}
            except Exception:
                return {"ip": v}
        return {"ip": v}

    @staticmethod
    def _add_yaml_dict_keys_to_set(path: Path, out: set[str]) -> None:
        if not path.exists():
            return
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            return
        for k in raw.keys():
            name = str(k or "").strip()
            if name:
                out.add(name)

    def import_fortimgr(self, *, env: str) -> Dict[str, Any]:
        e = self._normalize_env(env)
        self._validate_env_exists(e)

        fortimgr_addrs_dict = read_fortimgr_addrs_for_env(env=e)

        inv_path = self._path(env=e)
        inv_raw = read_yaml_dict(inv_path)
        if not isinstance(inv_raw, dict):
            inv_raw = {}
        
        inventory_iprange_list: List[Tuple[int, int, int]] = []
        for k in inv_raw.keys():
            try:
                inventory_iprange_list.append(self._to_ip_range_from_inventory_key(str(k)))
            except Exception:
                continue

        fm_addr_match_dict: Dict[str, str] = {}
        for name, val in fortimgr_addrs_dict.items():
            try:
                fm_range = self._to_ip_range_from_fortimgr_value(val)[:3]
            except Exception:
                continue

            matched = False
            for inv_range in inventory_iprange_list:
                if self._ranges_overlap(fm_range, inv_range):
                    matched = True
                    break
            if matched:
                fm_addr_match_dict[name] = val

        generated_prefix = get_generated_folder_prefix()
        if not str(self._product or "").strip():
            repo_root = get_fwconfigfiles_root(None)
        else:
            repo_name = get_product_generated_repo_name(product=str(self._product or ""))
            repo_root = get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name

        envgenfolder = repo_root / e / generated_prefix
        address_dir = envgenfolder / "address"
        address_dir.mkdir(parents=True, exist_ok=True)

        existing_address_dict = read_existing_addresses(address_dir=address_dir)
        addr_name_override_to_key: Dict[str, str] = {}
        for k, v in existing_address_dict.items():
            raw_no = v.get("name-override")
            if isinstance(raw_no, list):
                overrides = [str(x or "").strip() for x in raw_no]
                overrides = [x for x in overrides if x]
            else:
                overrides = []
            for no in overrides:
                addr_name_override_to_key[no] = k

        excluded_addr_names: set[str] = set()
        pfc_repo_raw = str(os.getenv("PFC_REPO", "") or "").strip()
        if pfc_repo_raw:
            common_excluded_path = Path(pfc_repo_raw).expanduser() / "settings" / "import" / e / "common_address_excluded_from_import.yaml"
            self._add_yaml_dict_keys_to_set(common_excluded_path, excluded_addr_names)

        excluded_addr_path = repo_root / "overrides" / e / "address_excluded_from_import.yaml"
        self._add_yaml_dict_keys_to_set(excluded_addr_path, excluded_addr_names)

        addr_unmatch_dict: Dict[str, Dict[str, Any]] = {}
        existing_conflict_updates = 0
        existing_match_count = 0

        fm_addr_filtered_dict: Dict[str, str] = {}
        for fm_name, fm_val in fm_addr_match_dict.items():
            if fm_name in excluded_addr_names:
                continue
            fm_addr_filtered_dict[fm_name]= fm_val

        for fm_name, fm_val in fm_addr_filtered_dict.items():
            existing_key = fm_name if fm_name in existing_address_dict else addr_name_override_to_key.get(fm_name)
            fm_data = self._fortimgr_value_to_address_data(fm_val)

            if existing_key:
                existing_match_count += 1
                existing_data = existing_address_dict.get(existing_key) or {}
                existing_value = str(existing_data.get("ip") or existing_data.get("range") or existing_data.get("subnet") or "").strip()
                fm_value_norm = str(fm_data.get("ip") or fm_data.get("range") or fm_data.get("subnet") or "").strip()
                if existing_value and fm_value_norm and existing_value != fm_value_norm:
                    existing_conflict_updates += 1
                continue

            addr_unmatch_dict[fm_name] = {"in-firewall": True, **fm_data}

        out_path = address_dir / "fm_extract_address.yaml"
        write_yaml_dict(out_path, {"addresses": addr_unmatch_dict}, sort_keys=True)



        fm_product_groups = build_fortimgr_matched_groups_for_env(env=e, product_addr_match_dict=fm_addr_filtered_dict)

        groups_dir = envgenfolder / "groups"
        groups_dir.mkdir(parents=True, exist_ok=True)

        excluded_group_names: set[str] = set()
        pfc_repo_raw = str(os.getenv("PFC_REPO", "") or "").strip()
        if pfc_repo_raw:
            common_excluded_groups_path = Path(pfc_repo_raw).expanduser() / "settings" / "import" / e / "common_groups_excluded_from_import.yaml"
            self._add_yaml_dict_keys_to_set(common_excluded_groups_path, excluded_group_names)

        excluded_groups_path = repo_root / "overrides" / e / "groups_excluded_from_import.yaml"
        self._add_yaml_dict_keys_to_set(excluded_groups_path, excluded_group_names)

        group_index = read_existing_group_names(groups_dir=groups_dir)
        existing_group_names = group_index.get("names") if isinstance(group_index, dict) else set()
        group_name_override_to_key = group_index.get("name_override_to_key") if isinstance(group_index, dict) else {}

        fm_grps_not_in_git = {
            k: v
            for k, v in (fm_product_groups or {}).items()
            if k not in excluded_group_names and k not in existing_group_names and k not in group_name_override_to_key
        }

        out_groups_path = groups_dir / "fm_extract_groups.yaml"
        write_yaml_dict(out_groups_path, {"groups": fm_grps_not_in_git}, sort_keys=True)

        if str(self._product or "").strip():
            AddressesService(product=str(self._product or "")).build_addr_used_in_rule_metadata(env=e)
        else:
            build_address_used_in_rule_metadata(
                env=e,
                address_dir=address_dir,
                metadata_dir=envgenfolder / "metadata" / "address",
            )

        build_address_used_in_rule_metadata(
            env=e,
            address_dir=address_dir,
            metadata_dir=envgenfolder / "metadata" / "address",
        )
            
        build_group_used_in_group_metadata(
            env=e,
            groups_dir=groups_dir,
            metadata_dir=envgenfolder / "metadata" / "groups",
        )

        build_group_used_in_rule_metadata(
            env=e,
            groups_dir=groups_dir,
            metadata_dir=envgenfolder / "metadata" / "groups",
        )
        # Need a second round of processing of address objects 
        cleanup_address_not_used_by_product(
            address_dir=address_dir,
            groups_dir=groups_dir,
            metadata_dir=envgenfolder / "metadata" / "address",
            fm_product_groups=fm_product_groups,
            addr_unmatch_dict=addr_unmatch_dict,
            excluded_group_names=excluded_group_names,
        )

        return {
            "ok": True,
            "env": e,
            "fortimgr_total": len(fortimgr_addrs_dict),
            "inventory_total": len(inventory_iprange_list),
            "matched_total": len(fm_addr_match_dict),
            "matched_after_excluded_total": len(fm_addr_filtered_dict),
            "existing_matched_total": existing_match_count,
            "existing_conflict_updates": existing_conflict_updates,
            "unmatched_written_total": len(addr_unmatch_dict),
            "output_file": str(out_path),
        }

    def list_items(self, *, env: str) -> List[Dict[str, Any]]:
        self._validate_env_exists(env)
        path = self._path(env=env)
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        items: List[Dict[str, Any]] = []
        for k in sorted([str(x) for x in raw.keys()]):
            key = str(k or "").strip()
            if not key:
                continue
            items.append({"name": key, "data": dict(raw.get(k)) if isinstance(raw.get(k), dict) else {}})
        return items

    def save_item(self, *, env: str, payload: SaveItemRequest) -> None:
        self._validate_env_exists(env)
        key = self._normalize_key(payload.name)
        prev = self._normalize_key(payload.original_name) if str(payload.original_name or "").strip() else ""

        path = self._path(env=env)
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        if prev and prev != key:
            raw.pop(prev, None)

        raw[key] = {}
        write_yaml_dict(path, raw, sort_keys=True)

    def delete_item(self, *, env: str, name: str) -> None:
        self._validate_env_exists(env)
        key = self._normalize_key(name)

        path = self._path(env=env)
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        raw.pop(key, None)
        write_yaml_dict(path, raw, sort_keys=True)

    def bulk_upload(self, *, env: str, raw_text: str) -> Dict[str, Any]:
        self._validate_env_exists(env)
        text = str(raw_text or "")
        if not text.strip():
            raise ValidationError("text", "is required")

        # Split by any whitespace or commas.
        # Also strip common quoting characters around each token.
        tokens = re.split(r"[\s,]+", text)
        cleaned: List[str] = []
        for t in tokens:
            v = str(t or "").strip()
            if not v:
                continue
            v = v.replace('"', "").replace("'", "").strip()
            if not v:
                continue
            cleaned.append(v)

        normalized: List[str] = []
        seen: set[str] = set()
        for v in cleaned:
            key = self._normalize_key(v)
            if key in seen:
                continue
            seen.add(key)
            normalized.append(key)

        path = self._path(env=env)
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        added = 0
        for k in normalized:
            if k not in raw:
                raw[k] = {}
                added += 1

        write_yaml_dict(path, raw, sort_keys=True)
        return {
            "ok": True,
            "env": str(env),
            "submitted_total": len(normalized),
            "added_total": added,
            "final_total": len(raw),
            "output_file": str(path),
        }
