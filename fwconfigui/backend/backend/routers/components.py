"""API routes for components YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.components_service import ComponentsService

router = APIRouter(prefix="/api/v1/products/{product}/components", tags=["components"])


def get_service(product: str) -> ComponentsService:
    return ComponentsService(product)


@router.get("")
def list_items(request: Request, product: str, service: ComponentsService = Depends(get_service)):
    items = service.list_items()
    return {"type": "components", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: ComponentsService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=None)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: ComponentsService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: ComponentsService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
