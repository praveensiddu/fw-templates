"""API routes for port-protocol YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.port_protocol_service import PortProtocolService

router = APIRouter(prefix="/api/v1/products/{product}/port-protocol", tags=["port-protocol"])


def get_service(product: str) -> PortProtocolService:
    return PortProtocolService(product)


@router.get("")
def list_items(request: Request, product: str, service: PortProtocolService = Depends(get_service)):
    items = service.list_items()
    return {"type": "port-protocol", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: PortProtocolService = Depends(get_service),
) -> Dict[str, Any]:
    data = dict(payload.data or {})
    service.save_item(
        name=payload.name,
        port_protocol=data.get("port-protocol"),
        original_name=None,
    )
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: PortProtocolService = Depends(get_service),
) -> Dict[str, Any]:
    data = dict(payload.data or {})
    service.save_item(
        name=payload.name,
        port_protocol=data.get("port-protocol"),
        original_name=payload.original_name,
    )
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: PortProtocolService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
