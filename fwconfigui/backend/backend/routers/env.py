"""API routes for env YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import ListItemsResponse
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/infra/env", tags=["env"])

_FIXED_FILENAME = "env.yaml"


def get_service() -> FwConfigService:
    return FwConfigService()


@router.get("", response_model=ListItemsResponse, response_model_exclude_none=True)
def list_items(request: Request, service: FwConfigService = Depends(get_service)):
    items = [x for x in service.list_items("env") if str(x.get("filename", "")) == _FIXED_FILENAME]
    for it in items:
        if isinstance(it, dict) and "filename" in it:
            del it["filename"]
    return {"type": "env", "items": items}


@router.post("")
def save_item(
    request: Request,
    name: str,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    name = str(name or "").strip().lower()
    service.save_env(filename=_FIXED_FILENAME, name=name, data={}, original_name=None)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("env", filename=_FIXED_FILENAME, name=name)
    return {"ok": True}
