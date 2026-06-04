import re
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.services.common_service import get_product_templates_repo_name
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict
from pathlib import Path

_KEYWORDS_FILENAME = "keywords.yaml"

@log_all_methods()
class KeywordsService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    def _repo_root(self) -> Path:
        if not str(self._product or "").strip():
            return get_fwconfigfiles_root(None)
        repo_name = get_product_templates_repo_name(product=str(self._product or ""))
        return get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name

    @staticmethod
    def _normalize_keyword_name(name: str) -> str:
        v = str(name or "").strip().upper()
        v = re.sub(r"[^A-Z0-9]", "", v)
        if not v:
            raise ValidationError("name", "is required")
        return v

    def list_items(self) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        kfilename = self._repo_root() / _KEYWORDS_FILENAME
        if not Path(kfilename).exists():
            return out
        
        raw = read_yaml_dict(kfilename)
        if not isinstance(raw, dict):
            return out

        for key in raw.keys():
            name = str(key or "").strip().upper()
            if not name:
                continue
            out.append({"name": name})
        return out

    def save_item(self, *, name: str) -> None:
        kfilename = self._repo_root() / _KEYWORDS_FILENAME
        key = self._normalize_keyword_name(name)
        raw = read_yaml_dict(kfilename)
        if not isinstance(raw, dict):
            raw = {}
        raw[key] = {}
        write_yaml_dict(kfilename, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        kfilename = self._repo_root() / _KEYWORDS_FILENAME
        raw = read_yaml_dict(kfilename)
        if not isinstance(raw, dict):
            raw = {}
        key = self._normalize_keyword_name(name)
        if key in raw:
            del raw[key]
        write_yaml_dict(kfilename, raw, sort_keys=True)

