"""API routes for components YAML type.

This type is stored in a single YAML file: components.yaml

Format:
  componentname:
    networkarea: ""
    description: ""
    sites:
      prd: [US, NL]
      pac: [CH]
    exposedto: [app1, app2]

Keys are component names.
"""

from pathlib import Path
from typing import Any, Dict

import re
from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import ValidationError
from backend.models import DeleteItemRequest, ListItemsResponse, ListYamlFilesResponse, SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/fwconfig/components", tags=["fwconfig", "components"])

_FIXED_FILENAME = "components.yaml"
_ALLOWED_SITE_ENVS = {"prd", "pac", "rtb", "ent", "dev"}


def _path() -> Path:
    return get_fwconfigfiles_root() / _FIXED_FILENAME


def _normalize_component_name(name: str) -> str:
    v = str(name or "").strip()
    v = re.sub(r"[^A-Za-z0-9_-]", "", v)
    if not v:
        raise ValidationError("name", "is required")
    return v


def _normalize_networkarea(v: Any) -> str:
    x = str(v or "").strip().upper()
    x = re.sub(r"[^A-Z0-9_-]", "", x)
    return x


def _normalize_description(v: Any) -> str:
    return str(v or "").strip()


def _normalize_exposedto(v: Any) -> list[str]:
    if isinstance(v, list):
        parts = [str(x or "").strip() for x in v]
    else:
        parts = [p.strip() for p in str(v or "").split(",")]
    out = [p for p in parts if p]
    return sorted(list(dict.fromkeys(out)))


def _normalize_sites(v: Any) -> dict[str, list[str]]:
    raw = v if isinstance(v, dict) else {}
    out: dict[str, list[str]] = {}
    for env, sites in raw.items():
        env_key = str(env or "").strip().lower()
        if env_key not in _ALLOWED_SITE_ENVS:
            continue

        lst = sites if isinstance(sites, list) else []
        norm_sites: list[str] = []
        for s in lst:
            sn = str(s or "").strip().upper()
            sn = re.sub(r"[^A-Z0-9_-]", "", sn)
            if sn:
                norm_sites.append(sn)

        uniq = sorted(list(dict.fromkeys(norm_sites)))
        if uniq:
            out[env_key] = uniq

    return out


def get_service():
    return True


@router.get("/files", response_model=ListYamlFilesResponse)
def list_yaml_files(request: Request):
    return {"type": "components", "files": [{"filename": _FIXED_FILENAME}]}


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
                    "networkarea": str(data.get("networkarea", "") or "").strip(),
                    "description": str(data.get("description", "") or "").strip(),
                    "exposedto": data.get("exposedto") if isinstance(data.get("exposedto"), list) else [],
                    "sites": data.get("sites") if isinstance(data.get("sites"), dict) else {},
                },
            }
        )

    return {"type": "components", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_component_name(payload.name)
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)
    original = original if original else ""

    data = dict(payload.data or {})
    networkarea = _normalize_networkarea(data.get("networkarea"))
    description = _normalize_description(data.get("description"))
    exposedto = _normalize_exposedto(data.get("exposedto"))
    sites = _normalize_sites(data.get("sites"))

    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    if original and original != name:
        raw.pop(original, None)

    raw[name] = {
        "networkarea": networkarea,
        "description": description,
        "exposedto": exposedto,
        "sites": sites,
    }
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_component_name(payload.name)
    path = _path()
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    raw.pop(name, None)
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
