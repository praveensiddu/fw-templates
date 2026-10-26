"""API routes for components YAML type."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.components_service import ComponentsService, allowed_group_names

router = APIRouter(prefix="/api/v1/products/{product}/components", tags=["components"])


def get_service(product: str) -> ComponentsService:
    return ComponentsService(product)


@router.get("")
def list_items(request: Request, product: str, service: ComponentsService = Depends(get_service)):
    items = service.list_items()
    return {"type": "components", "items": items}


@router.get("/group-name-options")
def group_name_options(request: Request, product: str, env: Optional[str] = None) -> Dict[str, Any]:
    """Group names the product may reference (SITE-COMP-<ES>).

    Includes names derived from this product's components plus components of
    other products exposed to 'ALL' or to this product. When 'env' is given,
    '<ES>' is replaced by the env's letteridentifier.
    """
    return {"options": allowed_group_names(product, env=env)}


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
