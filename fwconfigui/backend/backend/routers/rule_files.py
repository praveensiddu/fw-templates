"""API routes for rule-files YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.rule_files_service import RuleFilesService

router = APIRouter(prefix="/api/v1/products/{product}/rule-files", tags=["rule-files"])


def get_service(product: str) -> RuleFilesService:
    return RuleFilesService(product)


@router.get("")
def list_items(request: Request, product: str, service: RuleFilesService = Depends(get_service)):
    items = service.list_items()
    return {"type": "rule-files", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    payload: SaveItemRequest,
    service: RuleFilesService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=payload.name, original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: RuleFilesService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
