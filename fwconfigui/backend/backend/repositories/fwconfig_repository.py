"""Repository for reading/writing fwconfig YAML files."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple

from backend.exceptions.custom import NotFoundError, ValidationError
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict
from backend.utils.workspace import get_fwconfigfiles_root

logger = logging.getLogger("uvicorn.error")


_TYPE_TO_DIR = {
    "port-protocol": "",
    "business-purpose": "",
    "fw-rules": "fw-rules",
    "env": "",
    "keywords": "",
}

_TYPE_TO_LIST_KEY = {
    "port-protocol": "port-protocol-list",
    "business-purpose": "business-purpose-list",
    "fw-rules": "flowtemplates",
    "env": "env-list",
    "keywords": "keywords-list",
}


class FwConfigRepository:
    """Data access for fwconfig YAML types."""

    @staticmethod
    def _type_root(yaml_type: str) -> Path:
        base = get_fwconfigfiles_root()
        subdir = _TYPE_TO_DIR[yaml_type]
        root = base if not subdir else (base / subdir)
        root.mkdir(parents=True, exist_ok=True)
        return root

    @staticmethod
    def list_files(yaml_type: str) -> List[Path]:
        return list_yaml_files(FwConfigRepository._type_root(yaml_type))

    @staticmethod
    def read_items(yaml_type: str) -> List[Tuple[str, Dict[str, Any]]]:
        key = _TYPE_TO_LIST_KEY[yaml_type]
        items: List[Tuple[str, Dict[str, Any]]] = []

        for path in FwConfigRepository.list_files(yaml_type):
            raw = read_yaml_dict(path)
            lst = raw.get(key, [])
            if not isinstance(lst, list):
                continue
            for entry in lst:
                if not isinstance(entry, dict):
                    continue
                items.append((path.name, entry))

        return items

    @staticmethod
    def item_exists(yaml_type: str, filename: str, name: str) -> bool:
        file_name = str(filename or "").strip()
        if not file_name:
            raise ValidationError("filename", "is required")
        if "/" in file_name or "\\" in file_name:
            raise ValidationError("filename", "must be a base filename")

        item_name = str(name or "").strip()
        if not item_name:
            raise ValidationError("name", "is required")

        key = _TYPE_TO_LIST_KEY[yaml_type]
        path = FwConfigRepository._type_root(yaml_type) / file_name

        raw = read_yaml_dict(path)
        lst = raw.get(key, [])
        if not isinstance(lst, list):
            return False

        match_key = "appflowid" if yaml_type == "fw-rules" else "name"
        for existing in lst:
            if isinstance(existing, dict) and str(existing.get(match_key, "")).strip() == item_name:
                return True
        return False

    @staticmethod
    def upsert_item(yaml_type: str, filename: str, name: str, entry: Dict[str, Any]) -> None:
        file_name = str(filename or "").strip()
        if not file_name:
            raise ValidationError("filename", "is required")
        if "/" in file_name or "\\" in file_name:
            raise ValidationError("filename", "must be a base filename")

        item_name = str(name or "").strip()
        if not item_name:
            raise ValidationError("name", "is required")

        key = _TYPE_TO_LIST_KEY[yaml_type]
        path = FwConfigRepository._type_root(yaml_type) / file_name

        raw = read_yaml_dict(path)
        lst = raw.get(key, [])
        if not isinstance(lst, list):
            lst = []

        match_key = "appflowid" if yaml_type == "fw-rules" else "name"

        next_lst: List[Dict[str, Any]] = []
        replaced = False
        for existing in lst:
            if isinstance(existing, dict) and str(existing.get(match_key, "")).strip() == item_name:
                if not replaced:
                    next_lst.append(entry)
                    replaced = True
                # If duplicates already exist in the YAML, drop extras to enforce uniqueness.
            else:
                if isinstance(existing, dict):
                    next_lst.append(existing)

        if not replaced:
            next_lst.append(entry)

        raw[key] = next_lst
        write_yaml_dict(path, raw, sort_keys=False)

    @staticmethod
    def delete_item(yaml_type: str, filename: str, name: str) -> None:
        file_name = str(filename or "").strip()
        if not file_name:
            raise ValidationError("filename", "is required")
        if "/" in file_name or "\\" in file_name:
            raise ValidationError("filename", "must be a base filename")

        item_name = str(name or "").strip()
        if not item_name:
            raise ValidationError("name", "is required")

        key = _TYPE_TO_LIST_KEY[yaml_type]
        path = FwConfigRepository._type_root(yaml_type) / file_name

        if not path.exists() or not path.is_file():
            logger.warning("File not found for delete: %s", path)
            raise NotFoundError("YAML file", file_name)

        raw = read_yaml_dict(path)
        lst = raw.get(key, [])
        if not isinstance(lst, list):
            lst = []

        match_key = "appflowid" if yaml_type == "fw-rules" else "name"

        before = len(lst)
        next_lst = [x for x in lst if not (isinstance(x, dict) and str(x.get(match_key, "")).strip() == item_name)]

        if len(next_lst) == before:
            logger.warning("Item not found for delete: %s in %s", item_name, file_name)
            raise NotFoundError("Item", item_name)

        raw[key] = next_lst
        write_yaml_dict(path, raw, sort_keys=False)
