"""API routes for networkareas YAML type.

This type is stored in a single YAML file: networkareas.yaml
Format:
  SERVERFARM:
    shortname: SF
    envs: []

Keys are network area names.
"""

from pathlib import Path
from typing import Any, Dict

import re
from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import ValidationError
from backend.models import DeleteItemRequest, ListItemsResponse, ListYamlFilesResponse, SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/fwconfig/networkareas", tags=["fwconfig", "networkareas"])

_FIXED_FILENAME = "networkareas.yaml"


def _path() -> Path:
    return get_fwconfigfiles_root() / _FIXED_FILENAME


def _normalize_name(name: str) -> str:
    v = str(name or "").strip().upper()
    v = re.sub(r"[^A-Z0-9_-]", "", v)
    if not v:
        raise ValidationError("name", "is required")
    return v


def _normalize_shortname(v: str) -> str:
    x = str(v or "").strip().upper()
    x = re.sub(r"[^A-Z0-9_-]", "", x)
    if not x:
        raise ValidationError("shortname", "is required")
    return x


def _normalize_envs(v: Any) -> list[str]:
    envs = v if isinstance(v, list) else []
    out = [str(x or "").strip().lower() for x in envs if str(x or "").strip()]
    return sorted(list(dict.fromkeys(out)))


def get_service():
    return True


@router.get("/files", response_model=ListYamlFilesResponse)
def list_yaml_files(request: Request):
    return {"type": "networkareas", "files": [{"filename": _FIXED_FILENAME}]}


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
                    "shortname": str(data.get("shortname", "") or "").strip(),
                    "envs": data.get("envs") if isinstance(data.get("envs"), list) else [],
                },
            }
        )

    return {"type": "networkareas", "items": items}


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
    shortname = _normalize_shortname(data.get("shortname"))
    envs = _normalize_envs(data.get("envs"))

    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    if original and original != name:
        raw.pop(original, None)

    raw[name] = {"shortname": shortname, "envs": envs}
    write_yaml_dict(path, raw, sort_keys=True)
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
