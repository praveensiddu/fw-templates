"""API routes for env YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.services.env_service import EnvService

router = APIRouter(prefix="/api/v1/infra/env", tags=["env"])


def get_service() -> EnvService:
    return EnvService()

@router.get("")
def list_items(
    request: Request,
    service: EnvService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
):
    enforce_request(user_context, "/infra/env", "GET", {})
    rows = service.list_items()
    return {"type": "env", "items": rows}


@router.post("")
def save_item(
    request: Request,
    name: str,
    service: EnvService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/infra/env", "POST", {})
    service.save_item(name=name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    service: EnvService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/infra/env", "DELETE", {})
    service.delete_item(name=name)
    return {"ok": True}
