import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import ValidationError
from backend.utils.logging_utils import log_all_methods
from backend.services.common_service import get_product_templates_repo_name
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

_PORT_PROTOCOL_FILENAME = "port-protocol.yaml"


@log_all_methods()
class PortProtocolService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    def _repo_root(self) -> Path:
        if not str(self._product or "").strip():
            return get_fwconfigfiles_root(None)
        repo_name = get_product_templates_repo_name(product=str(self._product or ""))
        return get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name

    @staticmethod
    def _normalize_name(name: str) -> str:
        v = str(name or "").strip().lower()
        v = re.sub(r"[^a-z0-9_-]", "", v)
        if not v:
            raise ValidationError("name", "is required")
        return v

    @staticmethod
    def _normalize_port_protocol(value: Any) -> Dict[str, Any]:
        pp = value if isinstance(value, dict) else {}
        port = str(pp.get("port", "") or "").strip()
        service = str(pp.get("service", "") or "").strip()
        if not port:
            raise ValidationError("data.port-protocol.port", "is required")
        if not service:
            raise ValidationError("data.port-protocol.service", "is required")
        return {"port": port, "service": service}

    def _path(self) -> Path:
        return self._repo_root() / _PORT_PROTOCOL_FILENAME

    def _overrides_path(self) -> Path:
        return self._repo_root() / "overrides" / "flows" / "port_protocol_overrides.yaml"

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
            v = raw.get(k)
            items.append({"name": name, "data": {"port-protocol": dict(v) if isinstance(v, dict) else {}}})
        return items

    def save_item(self, *, name: str, port_protocol: Any, original_name: Optional[str] = None) -> None:
        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        key = self._normalize_name(name)
        prev = self._normalize_name(original_name) if original_name is not None else ""

        if prev and prev != key:
            existing_keys = {self._normalize_name(k) for k in raw.keys()}
            if prev not in existing_keys:
                raise ValidationError("original_name", "does not exist")

            raw.pop(prev, None)

        raw[key] = self._normalize_port_protocol(port_protocol)
        write_yaml_dict(path, raw, sort_keys=True)

    def save_override(
        self,
        *,
        name: str,
        port: str,
        originalservice: str,
        newservice: str,
    ) -> None:
        key = self._normalize_name(name)
        p = str(port or "").strip()
        osvc = str(originalservice or "").strip()
        nsvc = str(newservice or "").strip()
        if not p:
            raise ValidationError("port", "is required")
        if not osvc:
            raise ValidationError("originalservice", "is required")
        if not nsvc:
            raise ValidationError("newservice", "is required")

        path = self._overrides_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        existing = raw.get(key)
        if isinstance(existing, dict):
            preserved_port = str(existing.get("port") or "").strip() or p
            preserved_original_service = str(existing.get("originalservice") or "").strip() or osvc
        else:
            preserved_port = p
            preserved_original_service = osvc

        raw[key] = {"port": preserved_port, "originalservice": preserved_original_service, "newservice": nsvc}
        write_yaml_dict(path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        key = self._normalize_name(name)
        raw.pop(key, None)
        write_yaml_dict(path, raw, sort_keys=True)

    def dedupe_item(self, *, duplicate_name: str, original_name: str) -> Tuple[int, int]:
        dup = self._normalize_name(duplicate_name)
        orig = self._normalize_name(original_name)
        if dup == orig:
            raise ValidationError("original_name", "must be different from duplicate_name")

        pp_path = self._path()
        raw = read_yaml_dict(pp_path)
        if not isinstance(raw, dict):
            raw = {}

        existing_keys = {self._normalize_name(k) for k in raw.keys()}
        if dup not in existing_keys:
            raise ValidationError("duplicate_name", "does not exist")
        if orig not in existing_keys:
            raise ValidationError("original_name", "does not exist")

        raw.pop(dup, None)
        write_yaml_dict(pp_path, raw, sort_keys=True)

        return (0, 0)
