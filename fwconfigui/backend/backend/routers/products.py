"""API routes for products YAML type.

This type is stored in a single YAML file: products.yaml
Format:
  PRODUCT1:
    description: "..."

Keys are product names.
"""

from pathlib import Path
from typing import Any, Dict

import re
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from backend.exceptions.custom import ValidationError
from backend.models import DeleteItemRequest, ListItemsResponse, SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/fwconfig/products", tags=["products"])

_FIXED_FILENAME = "products.yaml"


def _path() -> Path:
    return get_fwconfigfiles_root() / _FIXED_FILENAME


def _normalize_name(name: str) -> str:
    v = str(name or "").strip().upper()
    v = re.sub(r"[^A-Z0-9_-]", "", v)
    if not v:
        raise ValidationError("name", "is required")
    return v


def _normalize_description(v: Any) -> str:
    return str(v or "").strip()


def _normalize_components_prefix_list(v: Any) -> list[str]:
    xs = v if isinstance(v, list) else []
    out = [str(x or "").strip() for x in xs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


def _normalize_components_exclude_list(v: Any) -> list[str]:
    xs = v if isinstance(v, list) else []
    out = [str(x or "").strip() for x in xs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


def _normalize_envs(v: Any) -> list[str]:
    envs = v if isinstance(v, list) else []
    out = [str(x or "").strip().lower() for x in envs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


class ImportProductRequest(BaseModel):
    name: str


def get_service():
    return True


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request):
    raw = read_yaml_dict(_path())
    if not isinstance(raw, dict):
        raw = {}

    items = []
    for k in sorted([str(x) for x in raw.keys()]):
        val = raw.get(k)
        data = val if isinstance(val, dict) else {}
        items.append(
            {
                "filename": _FIXED_FILENAME,
                "name": k,
                "data": {
                    "name": k,
                    "envs": _normalize_envs(data.get("envs")),
                    "description": _normalize_description(data.get("description")),
                    "components_prefix_list": _normalize_components_prefix_list(data.get("components_prefix_list")),
                    "components_exclude_list": _normalize_components_exclude_list(data.get("components_exclude_list")),
                },
            }
        )

    return {"type": "products", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_name(payload.name)
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)

    data = dict(payload.data or {})
    envs = _normalize_envs(data.get("envs"))
    description = _normalize_description(data.get("description"))
    components_prefix_list = _normalize_components_prefix_list(data.get("components_prefix_list"))
    components_exclude_list = _normalize_components_exclude_list(data.get("components_exclude_list"))

    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    if original and original != name:
        raw.pop(original, None)

    raw[name] = {
        "envs": envs,
        "description": description,
        "components_prefix_list": components_prefix_list,
        "components_exclude_list": components_exclude_list,
    }
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.post("/import")
def import_product_components(
    request: Request,
    payload: ImportProductRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    _normalize_name(payload.name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_name(payload.name)
    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    raw.pop(name, None)
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
