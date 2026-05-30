import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from backend.exceptions.custom import ValidationError
from backend.services.common_service import get_generated_folder_prefix, get_product_templates_repo_name
from backend.utils.workspace import get_fwconfigfiles_root, get_settings_yaml_path
from backend.utils.yaml_utils import list_yaml_files


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

    def _get_templates_repo_name(self) -> str:
        return get_product_templates_repo_name(product=str(self._product or ""))

    def _env_flows_dir(self, env: str) -> Path:
        e = self._normalize_env(env)
        repo_name = self._get_templates_repo_name()
        generated_prefix = get_generated_folder_prefix()
        root = get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name / e / generated_prefix / "flows"
        return root

    @staticmethod
    def _normalize_rule(data: Any) -> Dict[str, Any]:
        payload = dict(data) if isinstance(data, dict) else {}

        def _list(key: str) -> List[str]:
            v = payload.get(key)
            if not isinstance(v, list):
                return []
            return [str(x or "").strip() for x in v if str(x or "").strip()]

        out: Dict[str, Any] = {
            "appflowid": str(payload.get("appflowid") or "").strip(),
            "source-list": _list("source-list"),
            "destination-list": _list("destination-list"),
            "protocol-port": _list("protocol-port"),
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
