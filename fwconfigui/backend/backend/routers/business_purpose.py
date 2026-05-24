"""API routes for business-purpose YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import BusinessPurposeOverrideRequest, DedupeBusinessPurposeRequest, SaveItemRequest
from backend.services.business_purpose_service import BusinessPurposeService

router = APIRouter(prefix="/api/v1/products/{product}/business-purpose", tags=["business-purpose"])


def get_service(product: str) -> BusinessPurposeService:
    return BusinessPurposeService(product)


@router.get("")
def list_items(request: Request, product: str, service: BusinessPurposeService = Depends(get_service)):
    items = service.list_items()
    return {"type": "business-purpose", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: BusinessPurposeService = Depends(get_service),
) -> Dict[str, Any]:
    data = dict(payload.data or {})
    service.save_item(
        name=payload.name,
        business_purpose=data.get("business-purpose"),
        original_name=None,
    )
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: BusinessPurposeService = Depends(get_service),
) -> Dict[str, Any]:
    data = dict(payload.data or {})
    service.save_item(
        name=payload.name,
        business_purpose=data.get("business-purpose"),
        original_name=payload.original_name,
    )
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: BusinessPurposeService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}


@router.post("/dedupe")
def dedupe_item(
    request: Request,
    product: str,
    payload: DedupeBusinessPurposeRequest,
    service: BusinessPurposeService = Depends(get_service),
) -> Dict[str, Any]:
    updated_files, updated_refs = service.dedupe_item(duplicate_name=payload.duplicate_name, original_name=payload.original_name)
    return {"ok": True, "updated_fw_rules_files": updated_files, "updated_fw_rules_references": updated_refs}


@router.put("/text_override")
def put_text_override(
    request: Request,
    product: str,
    payload: BusinessPurposeOverrideRequest,
    service: BusinessPurposeService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_override(name=payload.name, original_text=payload.original_text, newtext=payload.newtext)
    return {"ok": True}
