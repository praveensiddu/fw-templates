"""API routes for predefined port-protocol YAML type.

This type is stored in a single YAML file: settings/predefined-port-protocol.yaml
Format:
  tcp-443:
    aliases: ["https"]
    description: "HTTPS traffic"

Keys are predefined port-protocol names.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.predef_port_protocol_service import PredefPortProtocolService

router = APIRouter(prefix="/api/v1/infra/predef-port-protocol", tags=["predef-port-protocol"])


def get_service() -> PredefPortProtocolService:
    return PredefPortProtocolService()


@router.get("")
def list_items(request: Request, service: PredefPortProtocolService = Depends(get_service)):
    items = service.list_items()
    return {"type": "predef-port-protocol", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: PredefPortProtocolService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    payload: SaveItemRequest,
    service: PredefPortProtocolService = Depends(get_service),
) -> Dict[str, Any]:
    service.update_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    service: PredefPortProtocolService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
