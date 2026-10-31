from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_settings_yaml_path
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict


@log_all_methods()
class EnvService:
    _FIXED_FILENAME = "env.yaml"

    def _path(self) -> Path:
        return get_settings_yaml_path(self._FIXED_FILENAME)

    def list_items(self) -> List[Dict[str, Any]]:
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}

        rows: List[Dict[str, Any]] = []
        for env in raw.keys():
            rows.append({"name": env, "data": raw[env]})
        return rows

    @staticmethod
    def _normalize_letteridentifier(v: Any) -> str:
        s = str(v or "").strip().upper()
        if not s:
            raise ValidationError("letteridentifier", "is required")
        if not (len(s) == 1 and s.isalpha()):
            raise ValidationError("letteridentifier", "must be a single uppercase letter")
        return s

    @staticmethod
    def _normalize_uidisplayorder(v: Any) -> int:
        s = str(v if v is not None else "").strip()
        if not s:
            raise ValidationError("uidisplayorder", "is required")
        try:
            n = int(s)
        except (TypeError, ValueError):
            raise ValidationError("uidisplayorder", "must be a number starting from 1")
        if n < 1:
            raise ValidationError("uidisplayorder", "must be a number starting from 1")
        return n

    @staticmethod
    def _as_order(v: Any) -> Optional[int]:
        try:
            n = int(str(v).strip())
        except (TypeError, ValueError, AttributeError):
            return None
        return n if n >= 1 else None

    def save_item(self, *, name: str, letteridentifier: str = "", uidisplayorder: Any = None) -> None:
        n = str(name or "").strip().lower()
        li = self._normalize_letteridentifier(letteridentifier)
        order = self._normalize_uidisplayorder(uidisplayorder)
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}

        for other, odata in raw.items():
            if other == n or not isinstance(odata, dict):
                continue
            if self._as_order(odata.get("uidisplayorder")) == order:
                raise ValidationError("uidisplayorder", f"{order} is already used by '{other}'")

        entry = dict(raw.get(n)) if isinstance(raw.get(n), dict) else {}
        entry["letteridentifier"] = li
        entry["uidisplayorder"] = order
        raw[n] = entry
        write_yaml_dict(file_path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}
        if str(name) in raw:
            del raw[str(name)]
            write_yaml_dict(file_path, raw, sort_keys=True)
