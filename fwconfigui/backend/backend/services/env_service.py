from pathlib import Path
from typing import Any, Dict, List

from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict


class EnvService:
    _FIXED_FILENAME = "env.yaml"

    def _path(self) -> Path:
        return get_fwconfigfiles_root() / self._FIXED_FILENAME

    def list_items(self) -> List[Dict[str, Any]]:
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}

        rows: List[Dict[str, Any]] = []
        for env in raw.keys():
            rows.append({"name": env, "data": raw[env]})
        return rows

    def save_item(self, *, name: str) -> None:
        n = str(name or "").strip().lower()
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}
        raw[n] = {}
        write_yaml_dict(file_path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        file_path = self._path()
        raw = read_yaml_dict(file_path)
        if not isinstance(raw, dict):
            raw = {}
        if str(name) in raw:
            del raw[str(name)]
            write_yaml_dict(file_path, raw, sort_keys=True)
