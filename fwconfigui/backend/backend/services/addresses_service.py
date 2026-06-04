from pathlib import Path
import ipaddress
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.services.common_service import (
    build_address_used_in_group_metadata,
    build_address_used_in_rule_metadata,
    get_generated_folder_prefix,
    get_product_generated_repo_name,
    get_product_templates_repo_name,
    read_group_names,
)
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_fwconfigfiles_root, get_settings_yaml_path
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict


@log_all_methods()
class AddressesService:
    _DEFAULT_FILENAME = "addresses.yaml"
    _CLEANUP_STRATEGY_FILENAME = "addrs_cleanup_strategy.yaml"
    _DEFAULT_CLEANUP_STRATEGIES = [
        "delete after onboarding",
        "fix ip range",
        "rename after onboarding",
    ]

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
        v = str(name or "").strip()
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

    def _cleanup_strategy_path(self, env: str) -> Path:
        return self._env_address_metadata_dir(env) / self._CLEANUP_STRATEGY_FILENAME

    def _read_cleanup_strategy_index(self, env: str) -> Dict[str, Any]:
        path = self._cleanup_strategy_path(env)
        raw_any = read_yaml_dict(path) if path.exists() else {}
        raw = raw_any if isinstance(raw_any, dict) else {}

        # Support legacy/flat mapping format {"Addr": "strategy"}
        if "strategies" not in raw and "choices" not in raw:
            strategies = {str(k or "").strip(): str(v or "").strip() for k, v in raw.items() if str(k or "").strip()}
            strategies = {k: v for k, v in strategies.items() if v}
            return {"choices": list(self._DEFAULT_CLEANUP_STRATEGIES), "strategies": strategies}

        choices_raw = raw.get("choices")
        if isinstance(choices_raw, list):
            choices = [str(x or "").strip() for x in choices_raw]
            choices = [x for x in choices if x]
        else:
            choices = []
        for x in self._DEFAULT_CLEANUP_STRATEGIES:
            if x not in choices:
                choices.append(x)

        strategies_raw = raw.get("strategies")
        if isinstance(strategies_raw, dict):
            strategies = {str(k or "").strip(): str(v or "").strip() for k, v in strategies_raw.items() if str(k or "").strip()}
            strategies = {k: v for k, v in strategies.items() if v}
        else:
            strategies = {}

        return {"choices": choices, "strategies": strategies}

    def _write_cleanup_strategy_index(self, env: str, index: Dict[str, Any]) -> None:
        path = self._cleanup_strategy_path(env)
        path.parent.mkdir(parents=True, exist_ok=True)

        choices_raw = index.get("choices") if isinstance(index, dict) else None
        choices = choices_raw if isinstance(choices_raw, list) else []
        choices = [str(x or "").strip() for x in choices]
        choices = [x for x in choices if x]
        for x in self._DEFAULT_CLEANUP_STRATEGIES:
            if x not in choices:
                choices.append(x)
        choices = sorted(set(choices), key=lambda s: s.lower())

        strategies_raw = index.get("strategies") if isinstance(index, dict) else None
        strategies = strategies_raw if isinstance(strategies_raw, dict) else {}
        strategies_clean: Dict[str, str] = {}
        for k, v in strategies.items():
            kk = str(k or "").strip()
            vv = str(v or "").strip()
            if kk and vv:
                strategies_clean[kk] = vv

        write_yaml_dict(path, {"choices": choices, "strategies": strategies_clean}, sort_keys=True)

    def get_cleanup_strategy_choices(self, *, env: str) -> List[str]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)
        index = self._read_cleanup_strategy_index(e)
        choices = index.get("choices") if isinstance(index, dict) else []
        return choices if isinstance(choices, list) else []

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
        key_lc = key.lower()
        for p in list_yaml_files(root):
            raw = self._read_addresses_file(p)
            addrs = raw.get("addresses", {})
            if not isinstance(addrs, dict):
                continue
            for k in addrs.keys():
                kk = str(k or "").strip()
                if kk and kk.lower() == key_lc:
                    return (p.name, kk)
        return None

    def _remove_key_from_all_files(self, *, env: str, key: str) -> None:
        root = self._env_addrs_dir(env)
        key_lc = str(key or "").strip().lower()
        for p in list_yaml_files(root):
            raw = self._read_addresses_file(p)
            addrs = raw.get("addresses", {})
            if not isinstance(addrs, dict):
                addrs = {}
            removed = False
            for k in list(addrs.keys()):
                kk = str(k or "").strip()
                if kk and kk.lower() == key_lc:
                    addrs.pop(k, None)
                    removed = True
            if removed:
                self._write_addresses_file(p, addrs)

    def list_items(self, *, env: str) -> List[Dict[str, Any]]:
        self._validate_env_exists(env)
        root = self._env_addrs_dir(env)

        cleanup_index = self._read_cleanup_strategy_index(env)
        cleanup_map = cleanup_index.get("strategies") if isinstance(cleanup_index, dict) else {}
        cleanup_map = cleanup_map if isinstance(cleanup_map, dict) else {}
        cleanup_map_lc = {str(k or "").strip().lower(): str(v or "").strip() for k, v in cleanup_map.items() if str(k or "").strip() and str(v or "").strip()}

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

        addr2rules_path = self._env_address_metadata_dir(env) / "fw_address2rule.yaml"
        raw_addr2rules = read_yaml_dict(addr2rules_path) if addr2rules_path.exists() else {}
        addr2rules: Dict[str, List[str]] = raw_addr2rules if isinstance(raw_addr2rules, dict) else {}
        addr2rules_lc: Dict[str, List[str]] = {}
        for k, v in addr2rules.items():
            key = str(k or "").strip().lower()
            if not key:
                continue
            if isinstance(v, list):
                addr2rules_lc[key] = [str(x or "").strip() for x in v if str(x or "").strip()]
            else:
                addr2rules_lc[key] = []

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
                rules = addr2rules_lc.get(name.lower())
                if rules:
                    data["used-in-rule"] = len(rules)

                cs = cleanup_map_lc.get(name.lower())
                if cs:
                    data["cleanup-strategy"] = cs
                items.append({"filename": p.name, "name": name, "data": data})

        items.sort(key=lambda d: (str(d.get("filename", "") or "").lower(), str(d.get("name", "") or "").lower()))
        return items

    def build_addr_used_in_group_metadata(self, *, env: str) -> Dict[str, Any]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)

        return build_address_used_in_group_metadata(
            env=e,
            address_dir=self._env_addrs_dir(e),
            metadata_dir=self._env_address_metadata_dir(e),
        )
    def build_addr_used_in_rule_metadata(self, *, env: str) -> Dict[str, Any]:
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

        payload = dict(data or {})
        cleanup_strategy_provided = "cleanup-strategy" in payload
        cleanup_strategy = str(payload.pop("cleanup-strategy", "") or "").strip()
        entry = self._validate_address_fields(payload)

        existing = self._find_existing(env=env, name=key)
        # Creating new or renaming to a new key: enforce global uniqueness across files.
        if existing:
            (_, existing_key) = existing
            if existing_key.lower() == key.lower() and (not prev or prev.lower() != key.lower()):
                raise AlreadyExistsError("Address", existing_key)

        # If renaming, ensure the old key is removed wherever it lives.
        if prev and prev.lower() != key.lower():
            self._remove_key_from_all_files(env=env, key=prev)

            # Move cleanup strategy, unless explicitly overridden by payload.
            idx = self._read_cleanup_strategy_index(env)
            strategies = idx.get("strategies") if isinstance(idx, dict) else {}
            strategies = dict(strategies) if isinstance(strategies, dict) else {}
            moved = False
            for k0 in list(strategies.keys()):
                if str(k0 or "").strip().lower() == prev.lower():
                    if not cleanup_strategy:
                        cleanup_strategy = str(strategies.get(k0) or "").strip()
                    strategies.pop(k0, None)
                    moved = True
            if moved:
                idx["strategies"] = strategies
                self._write_cleanup_strategy_index(env, idx)

        root = self._env_addrs_dir(env)
        path = root / file_name
        raw = self._read_addresses_file(path)
        addrs = raw.get("addresses", {})
        if not isinstance(addrs, dict):
            addrs = {}

        if prev and prev.lower() != key.lower():
            for k in list(addrs.keys()):
                kk = str(k or "").strip()
                if kk and kk.lower() == prev.lower():
                    addrs.pop(k, None)

        addrs[key] = entry
        self._write_addresses_file(path, addrs)

        if cleanup_strategy_provided and not cleanup_strategy:
            idx = self._read_cleanup_strategy_index(env)
            strategies = idx.get("strategies") if isinstance(idx, dict) else {}
            strategies = dict(strategies) if isinstance(strategies, dict) else {}
            removed = False
            for k0 in list(strategies.keys()):
                if str(k0 or "").strip().lower() == key.lower():
                    strategies.pop(k0, None)
                    removed = True
            if removed:
                idx["strategies"] = strategies
                self._write_cleanup_strategy_index(env, idx)

        if cleanup_strategy:
            idx = self._read_cleanup_strategy_index(env)
            choices = idx.get("choices") if isinstance(idx, dict) else []
            choices = list(choices) if isinstance(choices, list) else []
            if cleanup_strategy not in choices:
                choices.append(cleanup_strategy)
            strategies = idx.get("strategies") if isinstance(idx, dict) else {}
            strategies = dict(strategies) if isinstance(strategies, dict) else {}
            strategies[key] = cleanup_strategy
            idx["choices"] = choices
            idx["strategies"] = strategies
            self._write_cleanup_strategy_index(env, idx)

    def delete_item(self, *, env: str, filename: Optional[str], name: str) -> None:
        self._validate_env_exists(env)
        file_name = self._normalize_filename(filename)
        key = self._normalize_name(name)
        key_lc = key.lower()

        root = self._env_addrs_dir(env)
        path = root / file_name
        raw = self._read_addresses_file(path)
        addrs = raw.get("addresses", {})
        if not isinstance(addrs, dict):
            addrs = {}

        for k in list(addrs.keys()):
            kk = str(k or "").strip()
            if kk and kk.lower() == key_lc:
                addrs.pop(k, None)
        self._write_addresses_file(path, addrs)

        idx = self._read_cleanup_strategy_index(env)
        strategies = idx.get("strategies") if isinstance(idx, dict) else {}
        strategies = dict(strategies) if isinstance(strategies, dict) else {}
        removed = False
        for k0 in list(strategies.keys()):
            if str(k0 or "").strip().lower() == key_lc:
                strategies.pop(k0, None)
                removed = True
        if removed:
            idx["strategies"] = strategies
            self._write_cleanup_strategy_index(env, idx)

    def prepary_legacy_grp2addr_appendlist(self, *, env: str) -> Dict[str, Any]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)

        addr2groups_path = self._env_address_metadata_dir(e) / "fw_address2group.yaml"
        addr2groups_any = read_yaml_dict(addr2groups_path) if addr2groups_path.exists() else {}
        addr2groups = addr2groups_any if isinstance(addr2groups_any, dict) else {}

        extract_addr_path = self._env_addrs_dir(e) / "fm_extract_address.yaml"
        extract_any = read_yaml_dict(extract_addr_path) if extract_addr_path.exists() else {}
        extract = extract_any if isinstance(extract_any, dict) else {}
        fm_addrs_any = extract.get("addresses")
        fm_addrs = fm_addrs_any if isinstance(fm_addrs_any, dict) else {}

        groups_dir = (
            get_fwconfigfiles_root(None)
            / "cloned-repositories"
            / self._get_generated_repo_name()
            / e
            / get_generated_folder_prefix()
            / "groups"
        )
        groups_dir.mkdir(parents=True, exist_ok=True)

        group_names = read_group_names(groups_dir=groups_dir)
        group_names_lc = {str(k or "").strip().lower(): str(k or "").strip() for k in group_names.keys() if str(k or "").strip()}

        group_members_lc: Dict[str, set[str]] = {}
        for p in list_yaml_files(groups_dir):
            doc_any = read_yaml_dict(p)
            doc = doc_any if isinstance(doc_any, dict) else {}
            groups_any = doc.get("groups")
            groups = groups_any if isinstance(groups_any, dict) else {}
            for gname, gdata_any in groups.items():
                g = str(gname or "").strip()
                if not g:
                    continue
                gdata = gdata_any if isinstance(gdata_any, dict) else {}
                members_any = gdata.get("members")
                members = members_any if isinstance(members_any, list) else []
                mem_set = {str(m or "").strip().lower() for m in members if str(m or "").strip()}
                group_members_lc[g.lower()] = mem_set

        addr2groups_lc: Dict[str, List[str]] = {}
        for k, v in addr2groups.items():
            kk = str(k or "").strip()
            if not kk:
                continue
            vv_any = v if isinstance(v, list) else []
            vv = [str(x or "").strip() for x in vv_any if str(x or "").strip()]
            addr2groups_lc[kk.lower()] = vv

        legacy_grp2addr_appenddict: Dict[str, List[str]] = {}

        for addr_name in fm_addrs.keys():
            a = str(addr_name or "").strip()
            if not a:
                continue
            a_lc = a.lower()
            if a_lc not in addr2groups_lc:
                continue

            for grp in addr2groups_lc.get(a_lc) or []:
                g = str(grp or "").strip()
                if not g:
                    continue
                g_key = group_names_lc.get(g.lower())
                if not g_key:
                    continue

                members = group_members_lc.get(g_key.lower()) or set()
                if a_lc in members:
                    continue
                legacy_grp2addr_appenddict.setdefault(g_key, []).append(a)

        out_groups: Dict[str, Any] = {}
        for g, addrs in legacy_grp2addr_appenddict.items():
            uniq = sorted({str(x or "").strip() for x in (addrs or []) if str(x or "").strip()})
            out_groups[g] = {"members": uniq}

        templates_repo = self._get_templates_repo_name()
        out_path = (
            get_fwconfigfiles_root(None)
            / "cloned-repositories"
            / templates_repo
            / "overrides"
            / e
            / "legacy_grp2addr_appendlist.yaml"
        )
        out_path.parent.mkdir(parents=True, exist_ok=True)
        write_yaml_dict(out_path, {"groups": out_groups}, sort_keys=True)

        return {"ok": True, "env": e, "output_file": str(out_path), "group_total": len(out_groups.keys())}

    def onboard_from_fm_extract(self, *, env: str, name: str) -> Dict[str, Any]:
        self._validate_env_exists(env)
        e = self._normalize_env(env)
        key = self._normalize_name(name)

        root = self._env_addrs_dir(e)
        extract_path = root / "fm_extract_address.yaml"
        onboarded_path = root / "fm_onboarded_address.yaml"

        extract_raw_any = read_yaml_dict(extract_path) if extract_path.exists() else {}
        extract_raw = extract_raw_any if isinstance(extract_raw_any, dict) else {}
        extract_addrs_any = extract_raw.get("addresses")
        extract_addrs = extract_addrs_any if isinstance(extract_addrs_any, dict) else {}

        extract_key: Optional[str] = None
        extract_val: Any = None
        key_lc = key.lower()
        for k0, v0 in list(extract_addrs.items()):
            kk = str(k0 or "").strip()
            if kk and kk.lower() == key_lc:
                extract_key = kk
                extract_val = v0
                break
        if not extract_key:
            raise ValidationError("name", f"'{key}' not found in fm_extract_address.yaml")

        extract_addrs.pop(extract_key, None)
        self._write_addresses_file(extract_path, extract_addrs)

        onboard_raw_any = read_yaml_dict(onboarded_path) if onboarded_path.exists() else {}
        onboard_raw = onboard_raw_any if isinstance(onboard_raw_any, dict) else {}
        onboard_addrs_any = onboard_raw.get("addresses")
        onboard_addrs = onboard_addrs_any if isinstance(onboard_addrs_any, dict) else {}

        onboard_addrs[extract_key] = dict(extract_val) if isinstance(extract_val, dict) else extract_val
        self._write_addresses_file(onboarded_path, onboard_addrs)

        return {"ok": True, "env": e, "name": extract_key, "from": "fm_extract_address.yaml", "to": "fm_onboarded_address.yaml"}


