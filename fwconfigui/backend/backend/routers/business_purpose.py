"""API routes for business-purpose YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.models import DeleteItemRequest, ListItemsResponse, SaveItemRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/fwconfig/business-purpose", tags=["business-purpose"])

_FIXED_FILENAME = "business-purpose.yaml"


def get_service() -> FwConfigService:
    return FwConfigService()


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, service: FwConfigService = Depends(get_service)):
    items = [x for x in service.list_items("business-purpose") if str(x.get("filename", "")) == _FIXED_FILENAME]
    return {"type": "business-purpose", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    original = str(payload.original_name or "").strip().lower()
    if original:
        raise ValidationError("original_name", "use PUT for update")

    name = str(payload.name or "").strip().lower()

    items = [x for x in service.list_items("business-purpose") if str(x.get("filename", "")) == _FIXED_FILENAME]
    existing = {str(x.get("name", "") or "").strip().lower() for x in items}
    if name in existing:
        raise AlreadyExistsError("Item", name)

    data = dict(payload.data or {})
    data["name"] = str(data.get("name", "") or name).strip().lower()
    service.save_business_purpose(filename=_FIXED_FILENAME, name=name, data=data, original_name=payload.original_name)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    original = str(payload.original_name or "").strip().lower()
    if not original:
        raise ValidationError("original_name", "is required for update")

    # Ensure the original exists before allowing update semantics.
    items = [x for x in service.list_items("business-purpose") if str(x.get("filename", "")) == _FIXED_FILENAME]
    existing = {str(x.get("name", "") or "").strip().lower() for x in items}
    if original not in existing:
        raise ValidationError("original_name", "not found")

    name = str(payload.name or "").strip().lower()
    data = dict(payload.data or {})
    data["name"] = str(data.get("name", "") or name).strip().lower()
    service.save_business_purpose(filename=_FIXED_FILENAME, name=name, data=data, original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("business-purpose", filename=_FIXED_FILENAME, name=payload.name)
    return {"ok": True}
