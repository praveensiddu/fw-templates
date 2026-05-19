"""API routes for product-scoped addresses."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.addresses_service import AddressesService

router = APIRouter(prefix="/api/v1/products/{product}/addrs/{env}", tags=["addrs"])


def get_service(product: str) -> AddressesService:
    return AddressesService(product)


@router.get("")
def list_items(request: Request, product: str, env: str, service: AddressesService = Depends(get_service)) -> Dict[str, Any]:
    items = service.list_items(env=env)
    return {"type": "addrs", "env": env, "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    env: str,
    payload: SaveItemRequest,
    filename: Optional[str] = None,
    service: AddressesService = Depends(get_service),
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
    service: AddressesService = Depends(get_service),
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
    service: AddressesService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(env=env, filename=filename, name=name)
    return {"ok": True}
