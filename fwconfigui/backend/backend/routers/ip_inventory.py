"""API routes for ip_inventory overrides."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.models import SaveItemRequest
from backend.services.ip_inventory_service import IpInventoryService

router = APIRouter(prefix="/api/v1/products/{product}/ip_inventory/{env}", tags=["ip_inventory"])


def get_service(product: str) -> IpInventoryService:
    return IpInventoryService(product)


@router.get("")
def list_items(
    request: Request,
    product: str,
    env: str,
    service: IpInventoryService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/ip_inventory", "GET", {"id": product})
    items = service.list_items(env=env)
    return {"type": "ip_inventory", "env": env, "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    env: str,
    payload: SaveItemRequest,
    service: IpInventoryService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/ip_inventory", "POST", {"id": product})
    service.save_item(env=env, payload=payload)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    env: str,
    payload: SaveItemRequest,
    service: IpInventoryService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/ip_inventory", "PUT", {"id": product})
    service.save_item(env=env, payload=payload)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    env: str,
    name: str,
    service: IpInventoryService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/ip_inventory", "DELETE", {"id": product})
    service.delete_item(env=env, name=name)
    return {"ok": True}


@router.post("/importfortimgr")
def import_from_fortimgr(
    request: Request,
    product: str,
    env: str,
    service: IpInventoryService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/ip_inventory", "POST", {"id": product})
    return service.import_fortimgr(env=env)


@router.post("/bulk-upload")
def bulk_upload(
    request: Request,
    product: str,
    env: str,
    payload: Dict[str, Any],
    service: IpInventoryService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/ip_inventory", "POST", {"id": product})
    return service.bulk_upload(env=env, raw_text=str(payload.get("text") or ""))
