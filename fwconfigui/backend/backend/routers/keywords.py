"""API routes for keywords YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import DeleteItemRequest, ListItemsResponse, SaveItemRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/fwconfig/keywords", tags=["keywords"])

_FIXED_FILENAME = "keywords.yaml"


def get_service() -> FwConfigService:
    return FwConfigService()


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, service: FwConfigService = Depends(get_service)):
    items = [x for x in service.list_items("keywords") if str(x.get("filename", "")) == _FIXED_FILENAME]
    return {"type": "keywords", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    name = str(payload.name or "").strip().upper()
    service.save_keywords(filename=_FIXED_FILENAME, name=name, data={}, original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("keywords", filename=_FIXED_FILENAME, name=payload.name)
    return {"ok": True}
