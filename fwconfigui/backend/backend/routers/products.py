"""API routes for products YAML type.

This type is stored in a single YAML file: products.yaml
Format:
  PRODUCT1:
    description: "..."

Keys are product names.
"""

from pathlib import Path
from typing import Any, Dict, Optional

import re
from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.models import SaveItemRequest
from backend.auth.rbac import calculate_resource_permissions, enforce_request, get_current_user_context
from backend.services.env_service import EnvService
from backend.utils.workspace import get_settings_yaml_path
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/fwconfig/products", tags=["products"])

_FIXED_FILENAME = "products.yaml"


def _path() -> Path:
    return get_settings_yaml_path(_FIXED_FILENAME)


def _normalize_name(name: str) -> str:
    v = str(name or "").strip().upper()
    v = re.sub(r"\s+", "", v)
    v = re.sub(r"[^A-Z0-9]", "", v)
    if not v:
        raise ValidationError("name", "is required")
    if len(v) < 2:
        raise ValidationError("name", "must be at least 2 characters")
    return v


def _normalize_description(v: Any) -> str:
    return str(v or "").strip()


def _normalize_components_prefix_list(v: Any) -> list[str]:
    xs = v if isinstance(v, list) else []
    out = [str(x or "").strip().upper() for x in xs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


def _normalize_components_exclude_list(v: Any) -> list[str]:
    xs = v if isinstance(v, list) else []
    out = [str(x or "").strip() for x in xs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


def _validate_components_prefix_list(raw: Dict[str, Any], *, name: str, original: str, prefixes: list[str]) -> None:
    if not prefixes:
        raise ValidationError("components_prefix_list", "must not be empty")
    for p in prefixes:
        if not re.fullmatch(r"[A-Z0-9_]+", p):
            raise ValidationError("components_prefix_list", f"prefix '{p}' must contain only letters, digits and '_'")
    skip = {str(name or "").strip().upper(), str(original or "").strip().upper()}
    for other_key, other_val in raw.items():
        if str(other_key or "").strip().upper() in skip:
            continue
        other_data = other_val if isinstance(other_val, dict) else {}
        for q in _normalize_components_prefix_list(other_data.get("components_prefix_list")):
            q_lc = q.lower()
            for p in prefixes:
                p_lc = p.lower()
                if p_lc == q_lc:
                    raise ValidationError("components_prefix_list", f"prefix '{p}' already used by product '{other_key}'")
                if p_lc.startswith(q_lc) or q_lc.startswith(p_lc):
                    raise ValidationError(
                        "components_prefix_list", f"prefix '{p}' overlaps with '{q}' of product '{other_key}'"
                    )


def _normalize_envs(v: Any) -> list[str]:
    envs = v if isinstance(v, list) else []
    out = [str(x or "").strip().lower() for x in envs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


def _normalize_flowids(v: Any) -> list[str]:
    xs = v if isinstance(v, list) else []
    out = []
    for x in xs:
        s = str(x or "").strip().upper()
        s = re.sub(r"[^A-Z0-9_-]", "", s)
        if not s:
            continue
        out.append(s)
    return sorted(list(dict.fromkeys(out)))


def get_service():
    return True


@router.get("")
def list_items(
    request: Request,
    name: Optional[str] = None,
    user_context: Dict[str, Any] = Depends(get_current_user_context),
):
    raw = read_yaml_dict(_path())
    if not isinstance(raw, dict):
        raw = {}

    name_key = ""
    if str(name or "").strip():
        name_key = _normalize_name(str(name))

    items = []
    for k in sorted([str(x) for x in raw.keys()]):
        if name_key and _normalize_name(k) != name_key:
            continue
        val = raw.get(k)
        data = val if isinstance(val, dict) else {}
        product_name = str(k or "").strip()
        # Use the landing page resource for product navigation to decide row-level permissions.
        # This matches the Casbin policy patterns like /products/*/rule-templates.
        resource_path = f"/products/{product_name}/rule-templates"
        permissions = calculate_resource_permissions(
            user_context,
            resource_path,
            {"id": product_name},
            view_actions=("GET",),
            manage_actions=("POST", "PUT", "DELETE"),
        )
        items.append(
            {
                "name": k,
                "permissions": permissions,
                "data": {
                    "name": k,
                    "envs": _normalize_envs(data.get("envs")),
                    "description": _normalize_description(data.get("description")),
                    "components_prefix_list": _normalize_components_prefix_list(data.get("components_prefix_list")),
                    "components_exclude_list": _normalize_components_exclude_list(data.get("components_exclude_list")),
                    "include_flowids": _normalize_flowids(data.get("include_flowids")),
                    "exclude_flowids": _normalize_flowids(data.get("exclude_flowids")),
                },
            }
        )

    return {"type": "products", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/products", "POST", {})
    name = _normalize_name(payload.name)
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)

    if original:
        raise ValidationError("original_name", "use PUT for update")

    data = dict(payload.data or {})
    envs = _normalize_envs(data.get("envs"))
    if len(envs) == 0:
        raise ValidationError("envs", "must not be empty")

    known_envs = {str(x.get("name", "") or "").strip().lower() for x in EnvService().list_items()}
    for e in envs:
        if e not in known_envs:
            raise ValidationError("envs", f"unknown env '{e}'")

    description = _normalize_description(data.get("description"))
    if not description:
        raise ValidationError("description", "must not be empty")

    components_prefix_list = _normalize_components_prefix_list(data.get("components_prefix_list"))
    components_exclude_list = _normalize_components_exclude_list(data.get("components_exclude_list"))

    include_flowids = _normalize_flowids(data.get("include_flowids"))
    exclude_flowids = _normalize_flowids(data.get("exclude_flowids"))

    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    if name in raw:
        raise AlreadyExistsError("Item", name)

    _validate_components_prefix_list(raw, name=name, original="", prefixes=components_prefix_list)

    raw[name] = {
        "envs": envs,
        "description": description,
        "components_prefix_list": components_prefix_list,
        "components_exclude_list": components_exclude_list,
        "include_flowids": include_flowids,
        "exclude_flowids": exclude_flowids,
    }
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/products", "PUT", {})
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)
    if not original:
        raise ValidationError("original_name", "is required for update")

    name = _normalize_name(payload.name)

    data = dict(payload.data or {})
    envs = _normalize_envs(data.get("envs"))
    if len(envs) == 0:
        raise ValidationError("envs", "must not be empty")

    known_envs = {str(x.get("name", "") or "").strip().lower() for x in EnvService().list_items()}
    for e in envs:
        if e not in known_envs:
            raise ValidationError("envs", f"unknown env '{e}'")

    description = _normalize_description(data.get("description"))
    if not description:
        raise ValidationError("description", "must not be empty")

    components_prefix_list = _normalize_components_prefix_list(data.get("components_prefix_list"))
    components_exclude_list = _normalize_components_exclude_list(data.get("components_exclude_list"))

    include_flowids = _normalize_flowids(data.get("include_flowids"))
    exclude_flowids = _normalize_flowids(data.get("exclude_flowids"))
    
    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}
    if original not in raw:
        raise ValidationError("original_name", "not found")

    _validate_components_prefix_list(raw, name=name, original=original, prefixes=components_prefix_list)

    if original != name:
        raw.pop(original, None)

    raw[name] = {
        "envs": envs,
        "description": description,
        "components_prefix_list": components_prefix_list,
        "components_exclude_list": components_exclude_list,
        "include_flowids": include_flowids,
        "exclude_flowids": exclude_flowids,
    }
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    _ok: bool = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/products", "DELETE", {})
    name = _normalize_name(name)
    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    raw.pop(name, None)
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
