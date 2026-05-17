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

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.models import ListItemsResponse, SaveItemRequest
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/products/{product}/fwconfig/components", tags=["components"])

_FIXED_FILENAME = "components.yaml"
_ALLOWED_SITE_ENVS = {"prd", "pac", "rtb", "ent", "dev"}


def _path(product: str) -> Path:
    return get_fwconfigfiles_root(product) / _FIXED_FILENAME


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


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, product: str):
    raw = read_yaml_dict(_path(product))
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
    product: str,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_component_name(payload.name)
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)
    original = original if original else ""

    if original:
        raise ValidationError("original_name", "use PUT for update")

    data = dict(payload.data or {})
    networkarea = _normalize_networkarea(data.get("networkarea"))
    description = _normalize_description(data.get("description"))
    exposedto = _normalize_exposedto(data.get("exposedto"))
    sites = _normalize_sites(data.get("sites"))

    path = _path(product)
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    if name in raw:
        raise AlreadyExistsError("Item", name)

    raw[name] = {
        "networkarea": networkarea,
        "description": description,
        "exposedto": exposedto,
        "sites": sites,
    }
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)
    if not original:
        raise ValidationError("original_name", "is required for update")

    name = _normalize_component_name(payload.name)

    data = dict(payload.data or {})
    networkarea = _normalize_networkarea(data.get("networkarea"))
    description = _normalize_description(data.get("description"))
    exposedto = _normalize_exposedto(data.get("exposedto"))
    sites = _normalize_sites(data.get("sites"))

    path = _path(product)
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}
    if original not in raw:
        raise ValidationError("original_name", "not found")

    if original != name:
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
    product: str,
    name: str,
    _ok: bool = Depends(get_service),
) -> Dict[str, Any]:
    name = _normalize_component_name(name)
    path = _path(product)
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}

    raw.pop(name, None)
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
