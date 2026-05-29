"""API routes for sites YAML type.

This type is stored in a single YAML file: sites.yaml
Format:
  US:
    envs: ["prd", "pac"]

Keys are site names.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import SaveItemRequest
from backend.services.sites_service import SitesService

router = APIRouter(prefix="/api/v1/infra/sites", tags=["sites"])


def get_service() -> SitesService:
    return SitesService()


@router.get("")
def list_items(request: Request, service: SitesService = Depends(get_service)):
    items = service.list_items()
    return {"type": "sites", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: SitesService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    payload: SaveItemRequest,
    service: SitesService = Depends(get_service),
) -> Dict[str, Any]:
    service.update_item(name=payload.name, data=dict(payload.data or {}), original_name=str(payload.original_name or ""))
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    service: SitesService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
