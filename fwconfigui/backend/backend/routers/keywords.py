"""API routes for keywords YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.services.keywords_service import KeywordsService

router = APIRouter(prefix="/api/v1/products/{product}/keywords", tags=["keywords"])


def get_service(product: str) -> KeywordsService:
    return KeywordsService(product)


@router.get("")
def list_items(
    request: Request,
    product: str,
    service: KeywordsService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
):
    enforce_request(user_context, f"/products/{product}/keywords", "GET", {"id": product})
    items = service.list_items()
    return {"type": "keywords", "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    name: str,
    service: KeywordsService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/keywords", "POST", {"id": product})
    service.save_item(name=name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    name: str,
    service: KeywordsService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/keywords", "DELETE", {"id": product})
    service.delete_item(name=name)
    return {"ok": True}
