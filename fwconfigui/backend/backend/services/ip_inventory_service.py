import ipaddress
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import ValidationError
from backend.models import SaveItemRequest
from backend.utils.workspace import get_product_templates_repo, get_product_generated_repo, get_settings_yaml_path
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict


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

    def _path(self, *, env: str) -> Path:
        e = self._normalize_env(env)
        root = get_product_templates_repo(self._product) / "ip_inventory" / e
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

    def _get_generated_folder_prefix(self) -> str:
        prefix = str(os.getenv("GENERATED_FOLDER_PREFIX", "") or "").strip()
        if not prefix:
            raise ValidationError("GENERATED_FOLDER_PREFIX", "env var is required")
        return prefix

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

    def _read_existing_addresses(self, address_dir: Path) -> Dict[str, Dict[str, Any]]:
        existing: Dict[str, Dict[str, Any]] = {}
        for p in list_yaml_files(address_dir):
            if str(p.name).strip().lower() in {"fm_extract_address.yaml", "fm_extract_address.yml"}:
                continue
            doc = read_yaml_dict(p)
            if not isinstance(doc, dict):
                continue
            addrs = doc.get("addresses")
            if not isinstance(addrs, dict):
                continue
            for k, v in addrs.items():
                name = str(k or "").strip()
                if not name:
                    continue
                existing[name] = dict(v) if isinstance(v, dict) else {}
        return existing

    def import_fortimgr(self, *, env: str) -> Dict[str, Any]:
        e = self._normalize_env(env)
        self._validate_env_exists(e)

        def _list_yaml_files_recursive(root: Path) -> List[Path]:
            if not root.exists() or not root.is_dir():
                return []
            out: List[Path] = []
            for p in sorted(root.rglob("*")):
                if not p.is_file():
                    continue
                if p.suffix.lower() not in {".yaml", ".yml"}:
                    continue
                out.append(p)
            return out

        fm_root_raw = str(os.getenv("FORTIMGR_EXTRACT_REPO", "") or "").strip()
        if not fm_root_raw:
            raise ValidationError("FORTIMGR_EXTRACT_REPO", "env var is required")
        fm_root = Path(fm_root_raw).expanduser()
        fm_addrs_dir = fm_root / e / "addrobjs"
        if not fm_addrs_dir.exists() or not fm_addrs_dir.is_dir():
            raise ValidationError("FORTIMGR_EXTRACT_REPO", f"missing dir '{fm_addrs_dir}' Make sure FORTIMGR_EXTRACT_REPO is an absolute folder")

        fortimgr_addrs_dict: Dict[str, str] = {}
        for p in _list_yaml_files_recursive(fm_addrs_dir):
            doc = read_yaml_dict(p)
            if not isinstance(doc, dict):
                continue
            for k, v in doc.items():
                key = str(k or "").strip()
                val = str(v or "").strip()
                if key and val:
                    fortimgr_addrs_dict[key] = val

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

        product_addr_match_dict: Dict[str, str] = {}
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
                product_addr_match_dict[name] = val

        generated_prefix = self._get_generated_folder_prefix()
        envgenfolder = get_product_generated_repo(self._product) / e / generated_prefix
        address_dir = envgenfolder / "address"
        address_dir.mkdir(parents=True, exist_ok=True)

        existing_address_dict = self._read_existing_addresses(address_dir)
        name_override_to_key: Dict[str, str] = {}
        for k, v in existing_address_dict.items():
            no = str(v.get("name-override") or "").strip()
            if no:
                name_override_to_key[no] = k

        excluded_addr_names: set[str] = set()
        pfc_repo_raw = str(os.getenv("PFC_REPO", "") or "").strip()
        if pfc_repo_raw:
            common_excluded_path = Path(pfc_repo_raw).expanduser() / "settings" / "import" / e / "common_address_excluded_from_import.yaml"
            if common_excluded_path.exists():
                raw = read_yaml_dict(common_excluded_path)
                if isinstance(raw, dict):
                    for k in raw.keys():
                        name = str(k or "").strip()
                        if name:
                            excluded_addr_names.add(name)

        excluded_addr_path = get_product_templates_repo(self._product) / "overrides" / e / "address_excluded_from_import.yaml"
        if excluded_addr_path.exists():
            raw = read_yaml_dict(excluded_addr_path)
            if isinstance(raw, dict):
                for k in raw.keys():
                    name = str(k or "").strip()
                    if name:
                        excluded_addr_names.add(name)

        addr_unmatch_dict: Dict[str, Dict[str, Any]] = {}
        existing_conflict_updates = 0
        existing_match_count = 0

        for fm_name, fm_val in product_addr_match_dict.items():
            if fm_name in excluded_addr_names:
                continue
            existing_key = fm_name if fm_name in existing_address_dict else name_override_to_key.get(fm_name)
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

        fm_groups_dir = fm_root / e / "expgrps"
        fm_groups_dict: Dict[str, List[str]] = {}
        if fm_groups_dir.exists() and fm_groups_dir.is_dir():
            for p in _list_yaml_files_recursive(fm_groups_dir):
                doc = read_yaml_dict(p)
                if not isinstance(doc, dict):
                    continue
                for group_name, members_raw in doc.items():
                    g = str(group_name or "").strip()
                    if not g:
                        continue
                    if not isinstance(members_raw, list):
                        continue

                    members: List[str] = []
                    for m in members_raw:
                        s = str(m or "").strip()
                        if not s:
                            continue
                        s = re.sub(r"\([^)]*\)", "", s).strip()
                        if s:
                            members.append(s)

                    if members:
                        fm_groups_dict[g] = members

        product_addr_names = set(product_addr_match_dict.keys())
        matched_groups: Dict[str, Dict[str, Any]] = {}
        for gname, members in fm_groups_dict.items():
            if any(m in product_addr_names for m in members):
                matched_groups[gname] = {"in-firewall": True, "members": list(members)}

        groups_dir = envgenfolder / "groups"
        groups_dir.mkdir(parents=True, exist_ok=True)

        excluded_group_names: set[str] = set()
        pfc_repo_raw = str(os.getenv("PFC_REPO", "") or "").strip()
        if pfc_repo_raw:
            common_excluded_groups_path = Path(pfc_repo_raw).expanduser() / "settings" / "import" / e / "common_groups_excluded_from_import.yaml"
            if common_excluded_groups_path.exists():
                raw = read_yaml_dict(common_excluded_groups_path)
                if isinstance(raw, dict):
                    for k in raw.keys():
                        name = str(k or "").strip()
                        if name:
                            excluded_group_names.add(name)

        excluded_groups_path = get_product_templates_repo(self._product) / "overrides" / e / "groups_excluded_from_import.yaml"
        if excluded_groups_path.exists():
            raw = read_yaml_dict(excluded_groups_path)
            if isinstance(raw, dict):
                for k in raw.keys():
                    name = str(k or "").strip()
                    if name:
                        excluded_group_names.add(name)

        for k in list(matched_groups.keys()):
            if k in excluded_group_names:
                matched_groups.pop(k, None)

        existing_group_names: set[str] = set()
        for p in list_yaml_files(groups_dir):
            if str(p.name).strip().lower() in {"fm_extract_groups.yaml", "fm_extract_groups.yml"}:
                continue
            doc = read_yaml_dict(p)
            if not isinstance(doc, dict):
                continue
            groups = doc.get("groups")
            if not isinstance(groups, dict):
                continue
            for k in groups.keys():
                name = str(k or "").strip()
                if name:
                    existing_group_names.add(name)

        for k in list(matched_groups.keys()):
            if k in existing_group_names:
                matched_groups.pop(k, None)

        out_groups_path = groups_dir / "fm_extract_groups.yaml"
        write_yaml_dict(out_groups_path, {"groups": matched_groups}, sort_keys=True)

        return {
            "ok": True,
            "env": e,
            "fortimgr_total": len(fortimgr_addrs_dict),
            "inventory_total": len(inventory_iprange_list),
            "matched_total": len(product_addr_match_dict),
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
