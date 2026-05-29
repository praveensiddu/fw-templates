"""API routes for product-scoped groups."""

import os
from pathlib import Path

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.groups_service import GroupsService
from backend.utils.workspace import get_product_templates_repo
from backend.utils.yaml_utils import read_yaml_dict, write_yaml_dict

router = APIRouter(prefix="/api/v1/products/{product}/groups/{env}", tags=["groups"])


def get_service(product: str) -> GroupsService:
    return GroupsService(product)


@router.get("")
def list_items(request: Request, product: str, env: str, service: GroupsService = Depends(get_service)) -> Dict[str, Any]:
    items = service.list_items(env=env)
    return {"type": "groups", "env": env, "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    env: str,
    payload: SaveItemRequest,
    filename: Optional[str] = None,
    service: GroupsService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(env=env, filename=filename, name=payload.name, data=dict(payload.data or {}), original_name=payload.original_name)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    env: str,
    payload: SaveItemRequest,
    filename: Optional[str] = None,
    service: GroupsService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(env=env, filename=filename, name=payload.name, data=dict(payload.data or {}), original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    env: str,
    name: str,
    filename: Optional[str] = None,
    service: GroupsService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(env=env, filename=filename, name=name)
    return {"ok": True}


@router.post("/check-used")
def check_used(request: Request, product: str, env: str, service: GroupsService = Depends(get_service)) -> Dict[str, Any]:
    return service.build_group_used_in_group_metadata(env=env)


@router.get("/used-in-groups")
def used_in_groups(
    request: Request,
    product: str,
    env: str,
    name: str,
    service: GroupsService = Depends(get_service),
) -> Dict[str, Any]:
    items = service.get_group_used_in_groups(env=env, name=name)
    return {"ok": True, "env": env, "name": name, "items": items}


@router.post("/exclude")
def exclude_from_import(
    request: Request,
    product: str,
    env: str,
    payload: SaveItemRequest,
) -> Dict[str, Any]:
    name = str(payload.name or "").strip()
    if not name:
        return {"ok": False, "error": "name is required"}
    path = get_product_templates_repo(product) / "overrides" / str(env or "").strip().lower() / "groups_excluded_from_import.yaml"
    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}
    raw[name] = {}
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}


@router.post("/exclude-common")
def exclude_from_env_common(
    request: Request,
    product: str,
    env: str,
    payload: SaveItemRequest,
) -> Dict[str, Any]:
    name = str(payload.name or "").strip()
    if not name:
        return {"ok": False, "error": "name is required"}

    pfc_repo_raw = str(os.getenv("PFC_REPO", "") or "").strip()
    if not pfc_repo_raw:
        return {"ok": False, "error": "PFC_REPO is not set"}

    e = str(env or "").strip().lower()
    if not e:
        return {"ok": False, "error": "env is required"}

    path = Path(pfc_repo_raw).expanduser() / "settings" / "import" / e / "common_groups_excluded_from_import.yaml"
    path.parent.mkdir(parents=True, exist_ok=True)

    raw = read_yaml_dict(path)
    if not isinstance(raw, dict):
        raw = {}
    raw[name] = {}
    write_yaml_dict(path, raw, sort_keys=True)
    return {"ok": True}
