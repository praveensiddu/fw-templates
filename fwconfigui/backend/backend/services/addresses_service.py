from pathlib import Path
import ipaddress
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.services.common_service import build_address_used_in_group_metadata, build_address_used_in_rule_metadata, get_generated_folder_prefix, get_product_generated_repo_name, get_product_templates_repo_name
from backend.utils.workspace import get_fwconfigfiles_root, get_settings_yaml_path
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict


class AddressesService:
    _DEFAULT_FILENAME = "addresses.yaml"

    def __init__(self, product: Optional[str] = None):
        self._product = product

    def _products_path(self) -> Path:
        return get_settings_yaml_path("products.yaml")

    def _get_generated_repo_name(self) -> str:
        return get_product_generated_repo_name(product=str(self._product or ""))

    def _get_templates_repo_name(self) -> str:
        return get_product_templates_repo_name(product=str(self._product or ""))

    @staticmethod
    def _normalize_env(env: str) -> str:
        v = str(env or "").strip().lower()
        if not v:
            raise ValidationError("env", "is required")
        return v

    @staticmethod
    def _normalize_name(name: str) -> str:
        v = str(name or "").strip().lower()
        v = "".join([c for c in v if c.isalnum() or c in {"_", "-"}])
        if not v:
            raise ValidationError("name", "is required")
        return v

    @staticmethod
    def _normalize_filename(filename: Optional[str]) -> str:
        v = str(filename or "").strip() or AddressesService._DEFAULT_FILENAME
        if not v:
            raise ValidationError("filename", "is required")
        if "/" in v or "\\" in v:
            raise ValidationError("filename", "must be a base filename")
        if not (v.lower().endswith(".yaml")):
            raise ValidationError("filename", "must end with .yaml")
        return v

    def _validate_env_exists(self, env: str) -> None:
        e = self._normalize_env(env)
        env_path = get_settings_yaml_path("env.yaml")
        raw = read_yaml_dict(env_path)
        if not isinstance(raw, dict) or not raw:
            return
        if e not in raw:
            raise ValidationError("env", f" address validation unknown env '{e}'")

    def _env_addrs_dir(self, env: str) -> Path:
        e = self._normalize_env(env)
        repo_name = self._get_generated_repo_name()
        generated_prefix = get_generated_folder_prefix()
        root = get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name / e / generated_prefix / "address"
        root.mkdir(parents=True, exist_ok=True)
        return root

    def _env_address_metadata_dir(self, env: str) -> Path:
        e = self._normalize_env(env)
        repo_name = self._get_generated_repo_name()
        generated_prefix = get_generated_folder_prefix()
        root = (
            get_fwconfigfiles_root(None)
            / "cloned-repositories"
            / repo_name
            / e
            / generated_prefix
            / "metadata"
            / "address"
        )
        root.mkdir(parents=True, exist_ok=True)
        return root

    def _read_addresses_file(self, path: Path) -> Dict[str, Any]:
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}
        addrs = raw.get("addresses")
        if not isinstance(addrs, dict):
            addrs = {}
        return {"addresses": dict(addrs)}

    def _write_addresses_file(self, path: Path, addresses: Dict[str, Any]) -> None:
        write_yaml_dict(path, {"addresses": addresses}, sort_keys=True)

    @staticmethod
    def _validate_address_fields(data: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(data or {})

        ip = str(payload.get("ip", "") or "").strip()
        rng = str(payload.get("range", "") or "").strip()
        subnet = str(payload.get("subnet", "") or "").strip()

        present = [bool(ip), bool(rng), bool(subnet)]
        if sum(1 for x in present if x) != 1:
            raise ValidationError("data", "exactly one of 'ip', 'range', or 'subnet' is required")

        out: Dict[str, Any] = {}
        if ip:
            try:
                ipaddress.ip_address(ip)
            except Exception:
                raise ValidationError("data.ip", "must be a valid IP address")
            out["ip"] = ip
        if rng:
            parts = [p.strip() for p in rng.split("-", 1)]
            if len(parts) != 2 or not parts[0] or not parts[1]:
                raise ValidationError("data.range", "must be in format '<ip>-<ip>'")
            try:
                ip_start = ipaddress.ip_address(parts[0])
                ip_end = ipaddress.ip_address(parts[1])
            except Exception:
                raise ValidationError("data.range", "must contain valid IP addresses")
            if ip_start.version != ip_end.version:
                raise ValidationError("data.range", "start and end IP versions must match")
            if int(ip_start) > int(ip_end):
                raise ValidationError("data.range", "start IP must be <= end IP")
            out["range"] = rng
        if subnet:
            try:
                # strict=False allows host bits; we still validate CIDR syntax.
                ipaddress.ip_network(subnet, strict=False)
            except Exception:
                raise ValidationError("data.subnet", "must be a valid CIDR like '1.1.1.1/24'")
            out["subnet"] = subnet

        name_override = payload.get("name-override")
        if name_override is not None:
            if not isinstance(name_override, list):
                raise ValidationError("data.name-override", "must be a list")
            cleaned = [str(x or "").strip() for x in name_override]
            cleaned = [x for x in cleaned if x]
            if cleaned:
                out["name-override"] = cleaned

        in_firewall = payload.get("in-firewall")
        if in_firewall is not None:
            if in_firewall is True:
                out["in-firewall"] = True
            elif in_firewall is False:
                out["in-firewall"] = False
            else:
                s = str(in_firewall or "").strip().lower()
                if s == "true":
                    out["in-firewall"] = True
                elif s == "false":
                    out["in-firewall"] = False

        return out

    def _find_existing(self, *, env: str, name: str) -> Optional[Tuple[str, str]]:
        root = self._env_addrs_dir(env)
        key = self._normalize_name(name)
        for p in list_yaml_files(root):
            raw = self._read_addresses_file(p)
            addrs = raw.get("addresses", {})
            if key in {str(k or "").strip().lower() for k in addrs.keys()}:
                return (p.name, key)
        return None

    def _remove_key_from_all_files(self, *, env: str, key: str) -> None:
        root = self._env_addrs_dir(env)
        for p in list_yaml_files(root):
            raw = self._read_addresses_file(p)
            addrs = raw.get("addresses", {})
            if not isinstance(addrs, dict):
                addrs = {}
            if key in {str(k or "").strip().lower() for k in addrs.keys()}:
                # remove by exact match (case-insensitive keys are normalized already)
                addrs.pop(key, None)
                self._write_addresses_file(p, addrs)

    def list_items(self, *, env: str) -> List[Dict[str, Any]]:
        self._validate_env_exists(env)
        root = self._env_addrs_dir(env)

        addr2groups_path = self._env_address_metadata_dir(env) / "fw_address2group.yaml"
        raw_addr2groups = read_yaml_dict(addr2groups_path) if addr2groups_path.exists() else {}
        addr2groups: Dict[str, List[str]] = raw_addr2groups if isinstance(raw_addr2groups, dict) else {}
        addr2groups_lc: Dict[str, List[str]] = {}
        for k, v in addr2groups.items():
            key = str(k or "").strip().lower()
            if not key:
                continue
            if isinstance(v, list):
                addr2groups_lc[key] = [str(x or "").strip() for x in v if str(x or "").strip()]
            else:
                addr2groups_lc[key] = []

        items: List[Dict[str, Any]] = []
        for p in list_yaml_files(root):
            raw = self._read_addresses_file(p)
            addrs = raw.get("addresses", {})
            if not isinstance(addrs, dict):
                continue

            for k, v in addrs.items():
                name = str(k or "").strip()
                if not name:
                    continue
                data = dict(v) if isinstance(v, dict) else {}
                groups = addr2groups_lc.get(name.lower())
                if groups:
                    data["used-in-grp"] = len(groups)
                items.append({"filename": p.name, "name": name, "data": data})

        items.sort(key=lambda d: (str(d.get("filename", "") or "").lower(), str(d.get("name", "") or "").lower()))
        return items

    def build_address_used_in_group_metadata(self, *, env: str) -> Dict[str, Any]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)

        return build_address_used_in_group_metadata(
            env=e,
            address_dir=self._env_addrs_dir(e),
            metadata_dir=self._env_address_metadata_dir(e),
        )
    def build_address_used_in_rule_metadata(self, *, env: str) -> Dict[str, Any]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)

        return build_address_used_in_rule_metadata(
            env=e,
            address_dir=self._env_addrs_dir(e),
            metadata_dir=self._env_address_metadata_dir(e),
        )
    def get_address_used_in_groups(self, *, env: str, name: str) -> List[str]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)
        n = str(name or "").strip()
        if not n:
            raise ValidationError("name", "is required")

        addr2groups_path = self._env_address_metadata_dir(e) / "fw_address2group.yaml"
        raw_any = read_yaml_dict(addr2groups_path) if addr2groups_path.exists() else {}
        raw = raw_any if isinstance(raw_any, dict) else {}
        for k, v in raw.items():
            if str(k or "").strip().lower() != n.lower():
                continue
            if isinstance(v, list):
                return [str(x or "").strip() for x in v if str(x or "").strip()]
            return []
        return []

    def get_address_used_in_rules(self, *, env: str, name: str) -> List[str]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)
        n = str(name or "").strip()
        if not n:
            raise ValidationError("name", "is required")

        addr2rules_path = self._env_address_metadata_dir(e) / "fw_address2rule.yaml"
        raw_any = read_yaml_dict(addr2rules_path) if addr2rules_path.exists() else {}
        raw = raw_any if isinstance(raw_any, dict) else {}
        for k, v in raw.items():
            if str(k or "").strip().lower() != n.lower():
                continue
            if isinstance(v, list):
                return [str(x or "").strip() for x in v if str(x or "").strip()]
            return []
        return []

    def save_item(
        self,
        *,
        env: str,
        filename: Optional[str],
        name: str,
        data: Dict[str, Any],
        original_name: Optional[str] = None,
    ) -> None:
        self._validate_env_exists(env)
        file_name = self._normalize_filename(filename)
        key = self._normalize_name(name)
        prev = self._normalize_name(original_name) if str(original_name or "").strip() else ""
        entry = self._validate_address_fields(data)

        existing = self._find_existing(env=env, name=key)
        # Creating new or renaming to a new key: enforce global uniqueness across files.
        if existing and (not prev or prev != key):
            raise AlreadyExistsError("Address", key)

        # If renaming, ensure the old key is removed wherever it lives.
        if prev and prev != key:
            self._remove_key_from_all_files(env=env, key=prev)

        root = self._env_addrs_dir(env)
        path = root / file_name
        raw = self._read_addresses_file(path)
        addrs = raw.get("addresses", {})
        if not isinstance(addrs, dict):
            addrs = {}

        if prev and prev != key:
            addrs.pop(prev, None)

        addrs[key] = entry
        self._write_addresses_file(path, addrs)

    def delete_item(self, *, env: str, filename: Optional[str], name: str) -> None:
        self._validate_env_exists(env)
        file_name = self._normalize_filename(filename)
        key = self._normalize_name(name)

        root = self._env_addrs_dir(env)
        path = root / file_name
        raw = self._read_addresses_file(path)
        addrs = raw.get("addresses", {})
        if not isinstance(addrs, dict):
            addrs = {}

        addrs.pop(key, None)
        self._write_addresses_file(path, addrs)
