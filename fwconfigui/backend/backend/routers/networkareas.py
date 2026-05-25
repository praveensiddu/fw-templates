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

from backend.models import ListItemsResponse, SaveItemRequest
from backend.services.networkareas_service import NetworkAreasService

router = APIRouter(prefix="/api/v1/infra/networkareas", tags=["networkareas"])


def get_service() -> NetworkAreasService:
    return NetworkAreasService()


@router.get("")
def list_items(request: Request, service: NetworkAreasService = Depends(get_service)):
    items = service.list_items()
    return {"type": "networkareas", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: NetworkAreasService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    payload: SaveItemRequest,
    service: NetworkAreasService = Depends(get_service),
) -> Dict[str, Any]:
    service.update_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    service: NetworkAreasService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
