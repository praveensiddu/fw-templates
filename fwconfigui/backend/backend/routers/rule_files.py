"""API routes for rule-files YAML type.

This type is stored in a single YAML file: rule-files.yaml
Format:
  fw-rules.yaml: {}
  other-file.yaml: {}

Keys are filenames of fw-rules YAML files.
"""

from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import ValidationError
from backend.models import ListItemsResponse, SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/products/{product}/fwconfig/rule-files", tags=["rule-files"])

_FIXED_FILENAME = "rule-files.yaml"


def _path(product: str) -> Path:
    return get_fwconfigfiles_root(product) / _FIXED_FILENAME


def _normalize_rule_filename(name: str) -> str:
    v = str(name or "").strip()
    if not v:
        raise ValidationError("name", "is required")
    if "/" in v or "\\" in v:
        raise ValidationError("name", "must be a base filename")
    return v


def get_service():
    return True


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, product: str):
    path = _path(product)
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    items = []
    for k in sorted([str(x) for x in raw.keys()]):
        items.append({"filename": _FIXED_FILENAME, "name": k, "data": {"name": k}})

    return {"type": "rule-files", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_rule_filename(payload.name)
    original = str(payload.original_name or "").strip()

    path = _path(product)
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    if original and original != name:
        raw.pop(original, None)

    raw[name] = raw.get(name) if isinstance(raw.get(name), dict) else {}
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_rule_filename(name)
    path = _path(product)
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    raw.pop(name, None)
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
