from pathlib import Path
from typing import Any, Dict, List

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
        if s and not (len(s) == 1 and s.isalpha()):
            raise ValidationError("letteridentifier", "must be a single uppercase letter")
        return s

    def save_item(self, *, name: str, letteridentifier: str = "") -> None:
        n = str(name or "").strip().lower()
        li = self._normalize_letteridentifier(letteridentifier)
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}
        raw[n] = {"letteridentifier": li} if li else {}
        write_yaml_dict(file_path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}
        if str(name) in raw:
            del raw[str(name)]
            write_yaml_dict(file_path, raw, sort_keys=True)
