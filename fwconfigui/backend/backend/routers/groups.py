"""API routes for product-scoped groups."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.groups_service import GroupsService

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
