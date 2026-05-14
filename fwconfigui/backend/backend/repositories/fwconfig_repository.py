"""Repository for reading/writing fwconfig YAML files."""

import logging
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

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
    "fw-rules": "flowtemplates",
}


def _is_mapping_storage_type(yaml_type: str) -> bool:
    # These types are now stored as a simple YAML mapping keyed by item name.
    # No backward compatibility with the legacy *-list wrapper is required.
    return yaml_type in {"env", "keywords", "port-protocol", "business-purpose"}


class FwConfigRepository:
    """Data access for fwconfig YAML types."""

    @staticmethod
    def find_item_file(yaml_type: str, name: str) -> Optional[str]:
        item_name = str(name or "").strip()
        if not item_name:
            return None

        match_key = "appflowid" if yaml_type == "fw-rules" else "name"
        for filename, entry in FwConfigRepository.read_items(yaml_type):
            if not isinstance(entry, dict):
                continue
            if str(entry.get(match_key, "") or "").strip() == item_name:
                return filename
        return None

    @staticmethod
    def _fw_rule_sort_key(entry: Dict[str, Any]) -> tuple:
        def endpoint_list_key(v: Any) -> str:
            lst = v if isinstance(v, list) else []
            parts: List[str] = []
            for it in lst:
                if not isinstance(it, dict):
                    continue
                group = str(it.get("group", "") or "").strip().lower()
                envs = it.get("envs")
                env_list = envs if isinstance(envs, list) else []
                env_part = ",".join(sorted([str(x or "").strip().lower() for x in env_list if str(x or "").strip()]))
                parts.append(f"{group}|{env_part}")
            return "\n".join(sorted(parts))

        src_key = endpoint_list_key(entry.get("source-list") or entry.get("source"))
        dst_key = endpoint_list_key(entry.get("destination-list") or entry.get("destination"))
        appflowid = str(entry.get("appflowid", "") or "").strip().upper()
        return (src_key, dst_key, appflowid)

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
        items: List[Tuple[str, Dict[str, Any]]] = []

        for path in FwConfigRepository.list_files(yaml_type):
            raw = read_yaml_dict(path)

            if _is_mapping_storage_type(yaml_type):
                if not isinstance(raw, dict):
                    continue

                for k, v in raw.items():
                    name = str(k or "").strip()
                    if not name:
                        continue

                    if yaml_type == "env":
                        entry = {"name": name}
                    elif yaml_type == "keywords":
                        entry = {"name": name}
                    elif yaml_type == "business-purpose":
                        entry = {"name": name, "business-purpose": v}
                    elif yaml_type == "port-protocol":
                        pp = v if isinstance(v, dict) else {}
                        entry = {"name": name, "port-protocol": dict(pp)}
                    else:
                        entry = {"name": name}

                    items.append((path.name, entry))
                continue

            key = _TYPE_TO_LIST_KEY[yaml_type]
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

        path = FwConfigRepository._type_root(yaml_type) / file_name

        raw = read_yaml_dict(path)

        if _is_mapping_storage_type(yaml_type):
            if not isinstance(raw, dict):
                return False
            return str(item_name) in {str(k or "").strip() for k in raw.keys()}

        key = _TYPE_TO_LIST_KEY[yaml_type]
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

        path = FwConfigRepository._type_root(yaml_type) / file_name

        raw = read_yaml_dict(path)

        if _is_mapping_storage_type(yaml_type):
            if not isinstance(raw, dict):
                raw = {}

            if yaml_type in {"env", "keywords"}:
                raw[item_name] = {}
            elif yaml_type == "business-purpose":
                raw[item_name] = str(entry.get("business-purpose", "") or "")
            elif yaml_type == "port-protocol":
                pp = entry.get("port-protocol")
                raw[item_name] = dict(pp) if isinstance(pp, dict) else {}
            else:
                raw[item_name] = {}

            write_yaml_dict(path, raw, sort_keys=True)
            return

        key = _TYPE_TO_LIST_KEY[yaml_type]
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

        if yaml_type == "fw-rules":
            next_lst = sorted([x for x in next_lst if isinstance(x, dict)], key=FwConfigRepository._fw_rule_sort_key)

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
        path = FwConfigRepository._type_root(yaml_type) / file_name

        if not path.exists() or not path.is_file():
            logger.warning("File not found for delete: %s", path)
            raise NotFoundError("YAML file", file_name)

        raw = read_yaml_dict(path)

        if _is_mapping_storage_type(yaml_type):
            if not isinstance(raw, dict):
                raw = {}
            if item_name not in {str(k or "").strip() for k in raw.keys()}:
                logger.warning("Item not found for delete: %s in %s", item_name, file_name)
                raise NotFoundError("Item", item_name)
            raw.pop(item_name, None)
            write_yaml_dict(path, raw, sort_keys=True)
            return

        key = _TYPE_TO_LIST_KEY[yaml_type]
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
