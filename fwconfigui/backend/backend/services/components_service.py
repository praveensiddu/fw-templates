import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.exceptions.custom import ValidationError
from backend.services.common_service import get_product_templates_repo_name
from backend.utils.logging_utils import log_all_methods
from backend.utils.workspace import get_fwconfigfiles_root, get_settings_yaml_path
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

_COMPONENTS_FILENAME = "components.yaml"
_ALLOWED_SITE_ENVS = {"prd", "qa", "rtb", "ent", "dev"}

logger = logging.getLogger("uvicorn.error")


@log_all_methods()
class ComponentsService:
    def __init__(self, product: Optional[str] = None):
        self._product = product

    def _repo_root(self) -> Path:
        if not str(self._product or "").strip():
            return get_fwconfigfiles_root(None)
        repo_name = get_product_templates_repo_name(product=str(self._product or ""))
        return get_fwconfigfiles_root(None) / "cloned-repositories" / repo_name

    def _path(self) -> Path:
        return self._repo_root() / _COMPONENTS_FILENAME

    @staticmethod
    def _normalize_component_name(name: str) -> str:
        v = str(name or "").strip().upper()
        if not v:
            raise ValidationError("name", "is required")
        if not re.fullmatch(r"[A-Z0-9_]+", v):
            raise ValidationError("name", "must contain only A-Z, 0-9 and _")
        return v

    def _components_prefix_list(self) -> List[str]:
        prod_key = str(self._product or "").strip().upper()
        if not prod_key:
            return []
        raw = read_yaml_dict(get_settings_yaml_path("products.yaml"))
        if not isinstance(raw, dict):
            return []
        prod: Any = None
        for k, v in raw.items():
            if str(k or "").strip().upper() == prod_key:
                prod = v
                break
        data = prod if isinstance(prod, dict) else {}
        xs = data.get("components_prefix_list")
        if not isinstance(xs, list):
            return []
        return [str(x or "").strip() for x in xs if str(x or "").strip()]

    @staticmethod
    def _normalize_networkarea(v: Any) -> str:
        x = str(v or "").strip().upper()
        x = re.sub(r"[^A-Z0-9_-]", "", x)
        return x

    @staticmethod
    def _normalize_description(v: Any) -> str:
        return str(v or "")

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
                        "description": str(data.get("description", "") or ""),
                        "exposedto": data.get("exposedto") if isinstance(data.get("exposedto"), list) else [],
                        "sites": data.get("sites") if isinstance(data.get("sites"), dict) else {},
                    },
                }
            )

        return items

    def save_item(self, *, name: str, data: Dict[str, Any], original_name: Optional[str] = None) -> None:
        key = self._normalize_component_name(name)
        prev = self._normalize_component_name(original_name) if original_name is not None else ""

        prefixes = self._components_prefix_list()
        if prefixes and key != prev and not any(key.startswith(p) for p in prefixes):
            raise ValidationError("name", f"must begin with one of: {', '.join(prefixes)}")

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
            existing_keys = {self._normalize_component_name(k) for k in raw.keys()}
            if prev not in existing_keys:
                raise ValidationError("original_name", "does not exist")

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


def _env_letteridentifier(env: str) -> str:
    """Letter identifier for an env from env.yaml ('' when unset/unknown)."""
    target = str(env or "").strip().lower()
    if not target:
        return ""
    from backend.services.env_service import EnvService

    for it in EnvService().list_items():
        if str(it.get("name") or "").strip().lower() == target:
            data = it.get("data") if isinstance(it.get("data"), dict) else {}
            return str(data.get("letteridentifier") or "").strip().upper()
    return ""


def allowed_group_names(product: str, env: Optional[str] = None, scope: str = "all") -> List[str]:
    """Group names a product may reference (SITE-COMP-<envletter> convention).

    A component contributes its names when it belongs to the product itself,
    or when its 'exposedto' list contains 'ALL' or the product name.

    Args:
        product: Product name (case-insensitive)
        env: When given, gropu name will end with env's letteridentifier
             (left literal when the env has none)
        scope: "own" returns only the product's own component groups;
               "all" (default) also includes other products' exposed components

    Returns:
        Sorted, de-duplicated list of allowed group names
    """
    current = str(product or "").strip().upper()
    own_only = str(scope or "").strip().lower() == "own"

    raw = read_yaml_dict(get_settings_yaml_path("products.yaml"))
    if not isinstance(raw, dict):
        raw = {}

    names: set[str] = set()
    for prod_key in raw.keys():
        owner = str(prod_key or "").strip()
        if not owner:
            continue
        if own_only and owner.upper() != current:
            continue
        try:
            items = ComponentsService(owner).list_items()
        except Exception as e:
            logger.warning("allowed_group_names: cannot read components for '%s': %s", owner, e)
            continue
        for it in items:
            comp = str(it.get("name") or "").strip() if isinstance(it, dict) else ""
            if not comp:
                continue
            data = it.get("data") if isinstance(it.get("data"), dict) else {}
            exp = {
                str(x or "").strip().upper()
                for x in (data.get("exposedto") if isinstance(data.get("exposedto"), list) else [])
                if str(x or "").strip()
            }
            if owner.upper() != current and "ALL" not in exp and current not in exp:
                continue
            sites = data.get("sites") if isinstance(data.get("sites"), dict) else {}
            for lst in sites.values():
                for s in (lst if isinstance(lst, list) else []):
                    site = str(s or "").strip()
                    if site:
                        names.add(f"{site}-{comp}")

    letter = _env_letteridentifier(env) if env is not None else ""
    if letter:
        resolved: set[str] = set()
        for nn in names:
            if not nn.endswith(f"-{letter}"):
                nn = f"{nn}-{letter}"
            resolved.add(nn)
        names = resolved

    return sorted(names, key=str.lower)
