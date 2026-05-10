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
from backend.models import DeleteItemRequest, ListItemsResponse, ListYamlFilesResponse, SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/fwconfig/rule-files", tags=["fwconfig", "rule-files"])

_FIXED_FILENAME = "rule-files.yaml"


def _path() -> Path:
    return get_fwconfigfiles_root() / _FIXED_FILENAME


def _normalize_rule_filename(name: str) -> str:
    v = str(name or "").strip()
    if not v:
        raise ValidationError("name", "is required")
    if "/" in v or "\\" in v:
        raise ValidationError("name", "must be a base filename")
    return v


def get_service():
    return True


@router.get("/files", response_model=ListYamlFilesResponse)
def list_yaml_files(request: Request):
    files = [{"filename": _FIXED_FILENAME}]
    return {"type": "rule-files", "files": files}


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request):
    path = _path()
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
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    if str(payload.filename or "").strip() and str(payload.filename or "").strip() != _FIXED_FILENAME:
        raise ValidationError("filename", f"must be '{_FIXED_FILENAME}'")

    name = _normalize_rule_filename(payload.name)
    original = str(payload.original_name or "").strip()

    path = _path()
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
    payload: DeleteItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_rule_filename(payload.name)

    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    raw.pop(name, None)
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
