import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

_BUSINESS_PURPOSE_FILENAME = "business-purpose.yaml"


class BusinessPurposeService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    @staticmethod
    def _normalize_name(name: str) -> str:
        v = str(name or "").strip().lower()
        v = re.sub(r"[^a-z0-9_-]", "", v)
        if not v:
            raise ValidationError("name", "is required")
        return v

    @staticmethod
    def _normalize_purpose(value: Any) -> str:
        v = str(value or "").strip()
        if not v:
            raise ValidationError("data.business-purpose", "is required")
        return v

    def _path(self) -> Path:
        return get_fwconfigfiles_root(self._product) / _BUSINESS_PURPOSE_FILENAME

    def list_items(self) -> List[Dict[str, Any]]:
        path = self._path()
        if not path.exists():
            return []

        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            return []

        items: List[Dict[str, Any]] = []
        for k in sorted([str(x) for x in raw.keys()]):
            name = self._normalize_name(k)
            items.append({"name": name, "data": {"business-purpose": str(raw.get(k) or "").strip()}})
        return items

    def save_item(self, *, name: str, business_purpose: Any, original_name: Optional[str] = None) -> None:
        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        key = self._normalize_name(name)
        prev = self._normalize_name(original_name) if original_name is not None else ""

        if prev and prev != key:
            raw.pop(prev, None)

        raw[key] = self._normalize_purpose(business_purpose)
        write_yaml_dict(path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        key = self._normalize_name(name)
        raw.pop(key, None)
        write_yaml_dict(path, raw, sort_keys=True)
