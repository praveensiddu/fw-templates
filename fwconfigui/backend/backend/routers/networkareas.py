"""API routes for networkareas YAML type.

This type is stored in a single YAML file: networkareas.yaml
Format:
  SERVERFARM:
    shortname: SF
    envs: []

Keys are network area names.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.models import SaveItemRequest
from backend.services.networkareas_service import NetworkAreasService

router = APIRouter(prefix="/api/v1/infra/networkareas", tags=["networkareas"])


def get_service() -> NetworkAreasService:
    return NetworkAreasService()


@router.get("")
def list_items(
    request: Request,
    service: NetworkAreasService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
):
    enforce_request(user_context, "/infra/networkarea", "GET", {})
    items = service.list_items()
    return {"type": "networkareas", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: NetworkAreasService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/infra/networkarea", "POST", {})
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    payload: SaveItemRequest,
    service: NetworkAreasService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/infra/networkarea", "PUT", {})
    service.update_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    service: NetworkAreasService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/infra/networkarea", "DELETE", {})
    service.delete_item(name=name)
    return {"ok": True}
