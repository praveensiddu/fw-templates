"""API routes for port-protocol YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.models import ListItemsResponse, SaveItemRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/products/{product}/fwconfig/port-protocol", tags=["port-protocol"])

_FIXED_FILENAME = "port-protocol.yaml"


def get_service(product: str) -> FwConfigService:
    return FwConfigService(product)


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, product: str, service: FwConfigService = Depends(get_service)):
    items = [x for x in service.list_items("port-protocol") if str(x.get("filename", "")) == _FIXED_FILENAME]
    return {"type": "port-protocol", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    original = str(payload.original_name or "").strip().lower()
    if original:
        raise ValidationError("original_name", "use PUT for update")

    name = str(payload.name or "").strip().lower()

    items = [x for x in service.list_items("port-protocol") if str(x.get("filename", "")) == _FIXED_FILENAME]
    existing = {str(x.get("name", "") or "").strip().lower() for x in items}
    if name in existing:
        raise AlreadyExistsError("Item", name)

    data = dict(payload.data or {})
    service.save_port_protocol(filename=_FIXED_FILENAME, name=name, data=data, original_name=payload.original_name)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    original = str(payload.original_name or "").strip().lower()
    if not original:
        raise ValidationError("original_name", "is required for update")

    items = [x for x in service.list_items("port-protocol") if str(x.get("filename", "")) == _FIXED_FILENAME]
    existing = {str(x.get("name", "") or "").strip().lower() for x in items}
    if original not in existing:
        raise ValidationError("original_name", "not found")

    name = str(payload.name or "").strip().lower()
    data = dict(payload.data or {})
    service.save_port_protocol(filename=_FIXED_FILENAME, name=name, data=data, original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("port-protocol", filename=_FIXED_FILENAME, name=name)
    return {"ok": True}
