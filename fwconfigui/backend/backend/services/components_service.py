import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

_COMPONENTS_FILENAME = "components.yaml"
_ALLOWED_SITE_ENVS = {"prd", "pac", "rtb", "ent", "dev"}


class ComponentsService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    def _path(self) -> Path:
        return get_fwconfigfiles_root(self._product) / _COMPONENTS_FILENAME

    @staticmethod
    def _normalize_component_name(name: str) -> str:
        v = str(name or "").strip()
        v = re.sub(r"[^A-Za-z0-9_-]", "", v)
        if not v:
            raise ValidationError("name", "is required")
        return v

    @staticmethod
    def _normalize_networkarea(v: Any) -> str:
        x = str(v or "").strip().upper()
        x = re.sub(r"[^A-Z0-9_-]", "", x)
        return x

    @staticmethod
    def _normalize_description(v: Any) -> str:
        return str(v or "").strip()

    @staticmethod
    def _normalize_exposedto(v: Any) -> List[str]:
        if isinstance(v, list):
            parts = [str(x or "").strip() for x in v]
        else:
            parts = [p.strip() for p in str(v or "").split(",")]
        out = [p for p in parts if p]
        return sorted(list(dict.fromkeys(out)))

    @staticmethod
    def _normalize_sites(v: Any) -> Dict[str, List[str]]:
        raw = v if isinstance(v, dict) else {}
        out: Dict[str, List[str]] = {}
        for env, sites in raw.items():
            env_key = str(env or "").strip().lower()
            if env_key not in _ALLOWED_SITE_ENVS:
                continue

            lst = sites if isinstance(sites, list) else []
            norm_sites: List[str] = []
            for s in lst:
                sn = str(s or "").strip().upper()
                sn = re.sub(r"[^A-Z0-9_-]", "", sn)
                if sn:
                    norm_sites.append(sn)

            uniq = sorted(list(dict.fromkeys(norm_sites)))
            if uniq:
                out[env_key] = uniq

        return out

    def list_items(self) -> List[Dict[str, Any]]:
        path = self._path()
        if not path.exists():
            return []

        raw = read_yaml_dict(path)
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
                        "networkarea": str(data.get("networkarea", "") or "").strip(),
                        "description": str(data.get("description", "") or "").strip(),
                        "exposedto": data.get("exposedto") if isinstance(data.get("exposedto"), list) else [],
                        "sites": data.get("sites") if isinstance(data.get("sites"), dict) else {},
                    },
                }
            )

        return items

    def save_item(self, *, name: str, data: Dict[str, Any], original_name: Optional[str] = None) -> None:
        key = self._normalize_component_name(name)
        prev = str(original_name or "").strip().upper()
        prev = re.sub(r"[^A-Z0-9_-]", "", prev)
        prev = prev if prev else ""

        payload = dict(data or {})
        networkarea = self._normalize_networkarea(payload.get("networkarea"))
        description = self._normalize_description(payload.get("description"))
        exposedto = self._normalize_exposedto(payload.get("exposedto"))
        sites = self._normalize_sites(payload.get("sites"))

        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        if prev and prev != key:
            raw.pop(prev, None)

        raw[key] = {
            "networkarea": networkarea,
            "description": description,
            "exposedto": exposedto,
            "sites": sites,
        }
        write_yaml_dict(path, raw, sort_keys=True)

    def delete_item(self, *, name: str) -> None:
        key = self._normalize_component_name(name)
        path = self._path()
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}

        raw.pop(key, None)
        write_yaml_dict(path, raw, sort_keys=True)
