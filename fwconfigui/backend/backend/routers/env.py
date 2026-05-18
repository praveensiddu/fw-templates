"""API routes for env YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import ListItemsResponse
from backend.utils.workspace import get_fwconfigfiles_root
from backend.services.fwconfig_service import FwConfigService
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/infra/env", tags=["env"])

_FIXED_FILENAME = "env.yaml"

@router.get("")
def list_items(request: Request):
    file_path = get_fwconfigfiles_root() / _FIXED_FILENAME
    raw = read_yaml_dict(file_path)
    if not isinstance(raw, dict):
        rows = {}
    rows: List[Dict[str, Any]] = []
    for env in raw.keys():
        rows.append({"name": env, "data": raw[env]})
    return {"type": "env", "items": rows}


@router.post("")
def save_item(
    request: Request,
    name: str,
) -> Dict[str, Any]:
    name = str(name or "").strip().lower()
    file_path = get_fwconfigfiles_root() / _FIXED_FILENAME
    raw = read_yaml_dict(file_path)
    raw[name] = {}
    write_yaml_dict(file_path, raw)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
) -> Dict[str, Any]:
    file_path = get_fwconfigfiles_root() / _FIXED_FILENAME
    raw = read_yaml_dict(file_path)
    if str(name) in raw:
        del raw[str(name)]
        write_yaml_dict(file_path, raw)
    return {"ok": True}
