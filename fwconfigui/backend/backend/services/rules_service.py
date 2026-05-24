import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from backend.exceptions.custom import ValidationError
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict


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

    def _env_flows_dir(self, env: str) -> Path:
        e = self._normalize_env(env)
        repo_name = self._get_templates_repo_name()
        templates_prefix = self._get_templates_folder_prefix()
        root = get_fwconfigfiles_root(None) / "cloned-repos" / repo_name / e / templates_prefix / "flows"
        root.mkdir(parents=True, exist_ok=True)
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
