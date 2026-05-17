import re
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict
from pathlib import Path

_KEYWORDS_FILENAME = "keywords.yaml"

class KeywordsService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    @staticmethod
    def _normalize_keyword_name(name: str) -> str:
        v = str(name or "").strip().upper()
        v = re.sub(r"[^A-Z0-9]", "", v)
        if not v:
            raise ValidationError("name", "is required")
        return v

    def list_items(self) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        kfilename = get_fwconfigfiles_root(self._product) / _KEYWORDS_FILENAME
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
        kfilename = get_fwconfigfiles_root(self._product) / _KEYWORDS_FILENAME
        key = self._normalize_keyword_name(name)
        raw = read_yaml_dict(kfilename)
        if not isinstance(raw, dict):
            raw = {}
        raw[key] = {}
        write_yaml_dict(kfilename, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        kfilename = get_fwconfigfiles_root(self._product) / _KEYWORDS_FILENAME
        raw = read_yaml_dict(kfilename)
        if not isinstance(raw, dict):
            raw = {}
        key = self._normalize_keyword_name(name)
        if key in raw:
            del raw[key]
        write_yaml_dict(kfilename, raw, sort_keys=True)

