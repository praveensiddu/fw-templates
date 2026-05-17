"""API routes for sites YAML type.

This type is stored in a single YAML file: sites.yaml
Format:
  US:
    envs: ["prd", "pac"]

Keys are site names.
"""

from pathlib import Path
from typing import Any, Dict

import re
from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.models import ListItemsResponse, SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/infra/sites", tags=["sites"])

_FIXED_FILENAME = "sites.yaml"


def _path() -> Path:
    return get_fwconfigfiles_root() / _FIXED_FILENAME


def _normalize_name(name: str) -> str:
    v = str(name or "").strip().upper()
    v = re.sub(r"[^A-Z0-9_-]", "", v)
    if not v:
        raise ValidationError("name", "is required")
    return v


def _normalize_envs(v: Any) -> list[str]:
    envs = v if isinstance(v, list) else []
    out = [str(x or "").strip().lower() for x in envs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


def get_service():
    return True


@router.get("", response_model=ListItemsResponse, response_model_exclude_none=True)
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
                "name": k,
                "data": {
                    "name": k,
                    "envs": data.get("envs") if isinstance(data.get("envs"), list) else [],
                },
            }
        )

    return {"type": "sites", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_name(payload.name)
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)

    if original:
        raise ValidationError("original_name", "use PUT for update")

    data = dict(payload.data or {})
    envs = _normalize_envs(data.get("envs"))

    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    if name in raw:
        raise AlreadyExistsError("Item", name)

    raw[name] = {"envs": envs}
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)
    if not original:
        raise ValidationError("original_name", "is required for update")

    name = _normalize_name(payload.name)

    data = dict(payload.data or {})
    envs = _normalize_envs(data.get("envs"))

    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}
    if original not in raw:
        raise ValidationError("original_name", "not found")

    if original != name:
        raw.pop(original, None)

    raw[name] = {"envs": envs}
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_name(name)
    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    raw.pop(name, None)
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
