"""API routes for keywords YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.services.keywords_service import KeywordsService

router = APIRouter(prefix="/api/v1/products/{product}/keywords", tags=["keywords"])



def get_service(product: str) -> KeywordsService:
    return KeywordsService(product)


@router.get("")
def list_items(request: Request, product: str, service: KeywordsService = Depends(get_service)):
    items = service.list_items()
    return {"type": "keywords", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    name: str,
    service: KeywordsService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: KeywordsService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
