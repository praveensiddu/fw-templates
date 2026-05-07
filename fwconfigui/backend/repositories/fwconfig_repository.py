"""Repository for reading/writing fwconfig YAML files."""

import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple

from backend.exceptions.custom import NotFoundError, ValidationError
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict
from backend.utils.workspace import get_fwconfigfiles_root

logger = logging.getLogger("uvicorn.error")


_TYPE_TO_DIR = {
    "port-protocol": "port-protocol",
    "business-purpose": "business-purpose",
    "fw-rules": "fw-rules",
}

_TYPE_TO_LIST_KEY = {
    "port-protocol": "port-protocol-list",
    "business-purpose": "business-purpose-list",
    "fw-rules": "flowtemplates",
}


class FwConfigRepository:
    """Data access for fwconfig YAML types."""

    @staticmethod
    def _type_root(yaml_type: str) -> Path:
        root = get_fwconfigfiles_root() / _TYPE_TO_DIR[yaml_type]
        root.mkdir(parents=True, exist_ok=True)
        return root

    @staticmethod
    def list_files(yaml_type: str) -> List[Path]:
        """List YAML files for given type."""

        return list_yaml_files(FwConfigRepository._type_root(yaml_type))

    @staticmethod
    def read_items(yaml_type: str) -> List[Tuple[str, Dict[str, Any]]]:
        """Read items from all YAML files for a type.

        Returns:
            List of tuples (filename, item_dict)
        """

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
    def upsert_item(yaml_type: str, filename: str, name: str, entry: Dict[str, Any]) -> None:
        """Create or update an item in a YAML file by `name` field."""

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

        next_lst: List[Dict[str, Any]] = []
        replaced = False
        for existing in lst:
            if isinstance(existing, dict) and str(existing.get("name", "")).strip() == item_name:
                next_lst.append(entry)
                replaced = True
            else:
                if isinstance(existing, dict):
                    next_lst.append(existing)

        if not replaced:
            next_lst.append(entry)

        raw[key] = next_lst
        write_yaml_dict(path, raw, sort_keys=False)

    @staticmethod
    def delete_item(yaml_type: str, filename: str, name: str) -> None:
        """Delete an item from a YAML file by name."""

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

        before = len(lst)
        next_lst = [x for x in lst if not (isinstance(x, dict) and str(x.get("name", "")).strip() == item_name)]

        if len(next_lst) == before:
            logger.warning("Item not found for delete: %s in %s", item_name, file_name)
            raise NotFoundError("Item", item_name)

        raw[key] = next_lst
        write_yaml_dict(path, raw, sort_keys=False)
