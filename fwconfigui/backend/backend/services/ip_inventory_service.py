import ipaddress
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import ValidationError
from backend.models import SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
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
        env_path = get_fwconfigfiles_root(None) / "env.yaml"
        raw = read_yaml_dict(env_path)
        if not isinstance(raw, dict) or not raw:
            return
        if e not in raw:
            raise ValidationError("env", f"unknown env '{e}'")

    def _path(self, *, env: str) -> Path:
        e = self._normalize_env(env)
        root = get_fwconfigfiles_root(None) / "overrides" / "ip_inventory" / e
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

    def _products_path(self) -> Path:
        return get_fwconfigfiles_root(None) / "products.yaml"

    def _get_templates_repo_name(self) -> str:
        raw = read_yaml_dict(self._products_path())
        if not isinstance(raw, dict):
            raw = {}

        prod_key = str(self._product or "").strip().upper()
        prod = raw.get(prod_key) if prod_key else None
        if not isinstance(prod, dict):
            prod = {}

        templates_repo = str(prod.get("templates-repo") or "").strip()
        if not templates_repo:
            raise ValidationError("templates-repo", "is required on product")

        parts = [p for p in templates_repo.split("/") if p]
        if not parts:
            raise ValidationError("templates-repo", "invalid format")
        repo_name = str(parts[-1]).strip()
        if not repo_name:
            raise ValidationError("templates-repo", "invalid format")
        return repo_name

    def _get_templates_folder_prefix(self) -> str:
        prefix = str(os.getenv("TEMPLATES_FOLDER_PREFIX", "") or "").strip()
        if not prefix:
            raise ValidationError("TEMPLATES_FOLDER_PREFIX", "env var is required")
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

        fm_root_raw = str(os.getenv("FORTIMGR_EXTRACT", "") or "").strip()
        if not fm_root_raw:
            raise ValidationError("FORTIMGR_EXTRACT", "env var is required")
        fm_root = Path(fm_root_raw).expanduser()
        fm_addrs_dir = fm_root / e / "addrs"
        if not fm_addrs_dir.exists() or not fm_addrs_dir.is_dir():
            raise ValidationError("FORTIMGR_EXTRACT", f"missing dir '{fm_addrs_dir}'")

        fortimgr_addrs_dict: Dict[str, str] = {}
        for p in list_yaml_files(fm_addrs_dir):
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

        repo_name = self._get_templates_repo_name()
        templates_prefix = self._get_templates_folder_prefix()
        envgenfolder = get_fwconfigfiles_root(None) / "cloned-repos" / repo_name / e / templates_prefix
        address_dir = envgenfolder / "address"
        address_dir.mkdir(parents=True, exist_ok=True)

        existing_address_dict = self._read_existing_addresses(address_dir)
        name_override_to_key: Dict[str, str] = {}
        for k, v in existing_address_dict.items():
            no = str(v.get("name-override") or "").strip()
            if no:
                name_override_to_key[no] = k

        addr_unmatch_dict: Dict[str, Dict[str, Any]] = {}
        existing_conflict_updates = 0
        existing_match_count = 0

        for fm_name, fm_val in product_addr_match_dict.items():
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
