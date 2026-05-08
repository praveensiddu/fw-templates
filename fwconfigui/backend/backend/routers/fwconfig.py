"""API routes for fwconfig YAML types."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request

from backend.dependencies import require_yaml_type
from backend.models import DeleteItemRequest, ListItemsResponse, ListYamlFilesResponse, SaveItemRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/fwconfig", tags=["fwconfig"])


def get_service() -> FwConfigService:
    return FwConfigService()


@router.get("/files", response_model=ListYamlFilesResponse)
def list_yaml_files(
    request: Request,
    type: Optional[str] = None,
    service: FwConfigService = Depends(get_service),
):
    yaml_type = require_yaml_type(type)
    files = [{"filename": f} for f in service.list_files(yaml_type)]
    return {"type": yaml_type, "files": files}


@router.get("/items", response_model=ListItemsResponse)
def list_items(
    request: Request,
    type: Optional[str] = None,
    service: FwConfigService = Depends(get_service),
):
    yaml_type = require_yaml_type(type)
    items = service.list_items(yaml_type)
    return {"type": yaml_type, "items": items}


@router.post("/items")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    type: Optional[str] = None,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    yaml_type = require_yaml_type(type)
    service.save_item(
        yaml_type,
        filename=payload.filename,
        name=payload.name,
        data=payload.data,
        original_name=payload.original_name,
    )
    return {"ok": True}


@router.delete("/items")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    type: Optional[str] = None,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    yaml_type = require_yaml_type(type)
    service.delete_item(yaml_type, filename=payload.filename, name=payload.name)
    return {"ok": True}
