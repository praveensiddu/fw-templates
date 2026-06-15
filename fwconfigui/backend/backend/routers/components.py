"""API routes for components YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.models import SaveItemRequest
from backend.services.components_service import ComponentsService

router = APIRouter(prefix="/api/v1/products/{product}/components", tags=["components"])


def get_service(product: str) -> ComponentsService:
    return ComponentsService(product)


@router.get("")
def list_items(
    request: Request,
    product: str,
    service: ComponentsService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
):
    enforce_request(user_context, f"/products/{product}/components", "GET", {"id": product})
    items = service.list_items()
    return {"type": "components", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: ComponentsService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/components", "POST", {"id": product})
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=None)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: ComponentsService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/components", "PUT", {"id": product})
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: ComponentsService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/components", "DELETE", {"id": product})
    service.delete_item(name=name)
    return {"ok": True}
