import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from backend.exceptions.custom import NotFoundError, ValidationError
from backend.services.common_service import get_rendered_folder_prefix, get_product_generated_repo_name
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_fwconfigfiles_root, get_settings_yaml_path
from backend.utils.yaml_utils import list_yaml_files


@log_all_methods()
class RulesService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    @staticmethod
    def _normalize_env(env: str) -> str:
        v = str(env or "").strip().lower()
        if not v:
            raise ValidationError("env", "is required")
        return v

    def _products_path(self) -> Path:
        return get_settings_yaml_path("products.yaml")

    def _get_rendered_repo_name(self) -> str:
        return get_product_generated_repo_name(product=str(self._product or ""))

    def _env_flows_dir(self, env: str) -> Path:
        e = self._normalize_env(env)
        repo_name = self._get_rendered_repo_name()
        rendered_f_prefix = get_rendered_folder_prefix()
        root = get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name / e / rendered_f_prefix / "fw-rules"
        return root

    @staticmethod
    def _normalize_rule(data: Any) -> Dict[str, Any]:
        payload = dict(data) if isinstance(data, dict) else {}

        def _list(key: str) -> List[str]:
            v = payload.get(key)
            if not isinstance(v, list):
                return []
            return [str(x or "").strip() for x in v if str(x or "").strip()]

        def _endpoint_names(key: str) -> List[str]:
            v = payload.get(key)
            if not isinstance(v, list):
                return []
            out: List[str] = []
            for item in v:
                if isinstance(item, dict):
                    g = str(item.get("group") or "").strip()
                else:
                    g = str(item or "").strip()
                if g:
                    out.append(g)
            return out

        def _scalar(*keys: str) -> str:
            for k in keys:
                v = payload.get(k)
                if isinstance(v, list):
                    joined = ", ".join(str(x or "").strip() for x in v if str(x or "").strip())
                    if joined:
                        return joined
                else:
                    s = str(v or "").strip()
                    if s:
                        return s
            return ""

        def _pp_map() -> List[Dict[str, str]]:
            v = payload.get("protocol-port-map")
            if not isinstance(v, list):
                return []
            out_map: List[Dict[str, str]] = []
            for item in v:
                if isinstance(item, dict):
                    proto = str(item.get("protocol-port") or "").strip()
                    svc = str(item.get("service_offered") or item.get("purpose") or "").strip()
                else:
                    proto, svc = str(item or "").strip(), ""
                if proto:
                    out_map.append({"protocol-port": proto, "service_offered": svc})
            return out_map

        out: Dict[str, Any] = {
            "appflowid": str(payload.get("name") or payload.get("appflowid") or "").strip(),
            "source-list": _endpoint_names("source-list"),
            "destination-list": _endpoint_names("destination-list"),
            "protocol-port-map": _pp_map(),
            "business-purpose": _scalar("business purpose", "business-purpose", "Business-purpose", "business_purpose"),
            "IN-FW": _scalar("IN-FW", "in-fw", "in_fw", "IN_FW"),
            "keywords": _list("keywords"),
        }
        return out

    def list_items(self, *, env: str) -> List[Dict[str, Any]]:
        root = self._env_flows_dir(env)
        items: List[Dict[str, Any]] = []

        for p in list_yaml_files(root):
            try:
                raw_any = yaml.safe_load(p.read_text())
            except Exception:
                raw_any = None

            rules_list = raw_any if isinstance(raw_any, list) else []
            for idx, rule in enumerate(rules_list):
                items.append(
                    {
                        "filename": p.name,
                        "idx": idx,
                        "data": self._normalize_rule(rule),
                    }
                )

        items.sort(key=lambda r: (str(r.get("filename") or "").lower(), str(r.get("data", {}).get("appflowid") or "").lower(), int(r.get("idx") or 0)))
        return items

    def _env_file_path(self, env: str, filename: str) -> Path:
        fn = str(filename or "").strip()
        if not fn or Path(fn).name != fn:
            raise ValidationError("filename", "is required and must be a plain file name")
        return self._env_flows_dir(env) / fn

    @staticmethod
    def _read_rules_file(path: Path) -> List[Any]:
        if not path.exists():
            raise NotFoundError("File", path.name)
        try:
            raw = yaml.safe_load(path.read_text())
        except Exception:
            raw = None
        return raw if isinstance(raw, list) else []

    @staticmethod
    def _write_rules_file(path: Path, rules: List[Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(yaml.safe_dump(rules, sort_keys=False))

    @staticmethod
    def _rule_name(rule: Any) -> str:
        if isinstance(rule, dict):
            return str(rule.get("name") or rule.get("appflowid") or "").strip()
        return ""

    def get_rule(self, *, env: str, filename: str, name: str) -> Dict[str, Any]:
        key = str(name or "").strip()
        if not key:
            raise ValidationError("appflowid", "is required")
        path = self._env_file_path(env, filename)
        for rule in self._read_rules_file(path):
            if self._rule_name(rule) == key:
                return dict(rule)
        raise NotFoundError("Item", key)

    def save_rule(self, *, env: str, filename: str, name: str, data: Dict[str, Any], original_name: Optional[str] = None, create: bool = False) -> None:
        key = str(name or "").strip()
        if not key:
            raise ValidationError("appflowid", "is required")

        path = self._env_file_path(env, filename)
        if path.exists():
            rules = self._read_rules_file(path)
        elif create:
            rules = []
        else:
            raise NotFoundError("File", path.name)

        payload = dict(data) if isinstance(data, dict) else {}
        payload.pop("appflowid", None)
        payload["name"] = key

        if create:
            for rule in rules:
                if self._rule_name(rule) == key:
                    raise ValidationError("appflowid", f"'{key}' already exists in {path.name}")
            rules.append(payload)
            self._write_rules_file(path, rules)
            return

        original = str(original_name or "").strip() or key
        match_idx = None
        for i, rule in enumerate(rules):
            if self._rule_name(rule) == original:
                match_idx = i
                break
        if match_idx is None:
            raise NotFoundError("Item", original)
        if key != original:
            for i, rule in enumerate(rules):
                if i != match_idx and self._rule_name(rule) == key:
                    raise ValidationError("appflowid", f"'{key}' already exists in {path.name}")

        merged = dict(rules[match_idx]) if isinstance(rules[match_idx], dict) else {}
        merged.update(payload)
        merged["name"] = key
        rules[match_idx] = merged
        self._write_rules_file(path, rules)

    def replace_rule(self, *, env: str, filename: str, name: str, data: Dict[str, Any]) -> None:
        key = str(name or "").strip()
        if not key:
            raise ValidationError("appflowid", "is required")
        path = self._env_file_path(env, filename)
        rules = self._read_rules_file(path)
        for i, rule in enumerate(rules):
            if self._rule_name(rule) == key:
                rules[i] = dict(data)
                rules[i]["name"] = key
                self._write_rules_file(path, rules)
                return
        raise NotFoundError("Item", key)

    def delete_rule(self, *, env: str, filename: str, name: str) -> None:
        key = str(name or "").strip()
        if not key:
            raise ValidationError("appflowid", "is required")
        path = self._env_file_path(env, filename)
        rules = self._read_rules_file(path)
        for i, rule in enumerate(rules):
            if self._rule_name(rule) == key:
                del rules[i]
                self._write_rules_file(path, rules)
                return
        raise NotFoundError("Item", key)
