import re
from pathlib import Path
from typing import Any, Dict, List

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_settings_yaml_path
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict


@log_all_methods()
class SitesService:
    _FIXED_FILENAME = "sites.yaml"

    def _path(self) -> Path:
        return get_settings_yaml_path(self._FIXED_FILENAME)

    def _normalize_name(self, name: str) -> str:
        v = str(name or "").strip().upper()
        v = re.sub(r"[^A-Z0-9_-]", "", v)
        if not v:
            raise ValidationError("name", "is required")
        return v

    def _normalize_envs(self, v: Any) -> List[str]:
        envs = v if isinstance(v, list) else []
        out = [str(x or "").strip().lower() for x in envs if str(x or "").strip()]
        return sorted(list(dict.fromkeys(out)))

    def list_items(self) -> List[Dict[str, Any]]:
        raw = read_yaml_dict(self._path())
        if not isinstance(raw, dict):
            raw = {}

        items: List[Dict[str, Any]] = []
        for k in sorted([str(x) for x in raw.keys()]):
            val = raw.get(k)
            data = val if isinstance(val, dict) else {}
            items.append(
                {
                    "name": k,
                    "data": {
                        "name": k,
                        "envs": data.get("envs") if isinstance(data.get("envs"), list) else [],
                    },
                }
            )

        return items

    def save_item(self, *, name: str, data: Dict[str, Any], original_name: str = "") -> None:
        n = self._normalize_name(name)
        original = str(original_name or "").strip().upper()
        original = re.sub(r"[^A-Z0-9_-]", "", original)

        if original:
            raise ValidationError("original_name", "use PUT for update")

        envs = self._normalize_envs(data.get("envs"))

        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        if n in raw:
            raise AlreadyExistsError("Item", n)

        raw[n] = {"envs": envs}
        write_yaml_dict(path, raw, sort_keys=True)

    def update_item(self, *, name: str, data: Dict[str, Any], original_name: str) -> None:
        original = str(original_name or "").strip().upper()
        original = re.sub(r"[^A-Z0-9_-]", "", original)
        if not original:
            raise ValidationError("original_name", "is required for update")

        n = self._normalize_name(name)

        envs = self._normalize_envs(data.get("envs"))

        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}
        if original not in raw:
            raise ValidationError("original_name", "not found")

        if original != n:
            raw.pop(original, None)

        raw[n] = {"envs": envs}
        write_yaml_dict(path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        n = self._normalize_name(name)
        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        raw.pop(n, None)
        write_yaml_dict(path, raw, sort_keys=True)
