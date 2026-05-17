"""API routes for keywords YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import ListItemsResponse
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/products/{product}/fwconfig/keywords", tags=["keywords"])

_FIXED_FILENAME = "keywords.yaml"


def get_service(product: str) -> FwConfigService:
    return FwConfigService(product)


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, product: str, service: FwConfigService = Depends(get_service)):
    items = [x for x in service.list_items("keywords") if str(x.get("filename", "")) == _FIXED_FILENAME]
    return {"type": "keywords", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    name: str,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    name = str(name or "").strip().upper()
    service.save_keywords(filename=_FIXED_FILENAME, name=name, data={}, original_name=None)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("keywords", filename=_FIXED_FILENAME, name=name)
    return {"ok": True}
