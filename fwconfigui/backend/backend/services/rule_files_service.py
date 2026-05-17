from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

_RULE_FILES_FILENAME = "rule-files.yaml"


class RuleFilesService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    def _path(self) -> Path:
        return get_fwconfigfiles_root(self._product) / _RULE_FILES_FILENAME

    @staticmethod
    def _normalize_rule_filename(name: str) -> str:
        v = str(name or "").strip()
        if not v:
            raise ValidationError("name", "is required")
        if "/" in v or "\\" in v:
            raise ValidationError("name", "must be a base filename")
        return v

    def list_items(self) -> List[Dict[str, Any]]:
        path = self._path()
        if not path.exists():
            return []

        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        items: List[Dict[str, Any]] = []
        for k in sorted([str(x) for x in raw.keys()]):
            items.append({"name": k, "data": {"name": k}})
        return items

    def save_item(self, *, name: str, original_name: Optional[str] = None) -> None:
        key = self._normalize_rule_filename(name)
        prev = str(original_name or "").strip()

        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        if prev and prev != key:
            raw.pop(prev, None)

        raw[key] = raw.get(key) if isinstance(raw.get(key), dict) else {}
        write_yaml_dict(path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        key = self._normalize_rule_filename(name)

        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        raw.pop(key, None)
        write_yaml_dict(path, raw, sort_keys=True)
