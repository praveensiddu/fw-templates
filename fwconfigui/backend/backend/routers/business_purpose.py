"""API routes for business-purpose YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import DeleteItemRequest, ListItemsResponse, ListYamlFilesResponse, SaveItemRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/fwconfig/business-purpose", tags=["fwconfig", "business-purpose"])

_FIXED_FILENAME = "business-purpose.yaml"


def get_service() -> FwConfigService:
    return FwConfigService()


@router.get("/files", response_model=ListYamlFilesResponse)
def list_yaml_files(request: Request, service: FwConfigService = Depends(get_service)):
    files = [{"filename": _FIXED_FILENAME}]
    return {"type": "business-purpose", "files": files}


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, service: FwConfigService = Depends(get_service)):
    items = [x for x in service.list_items("business-purpose") if str(x.get("filename", "")) == _FIXED_FILENAME]
    return {"type": "business-purpose", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    name = str(payload.name or "").strip().lower()
    data = dict(payload.data or {})
    data["name"] = str(data.get("name", "") or name).strip().lower()
    service.save_item("business-purpose", filename=_FIXED_FILENAME, name=name, data=data)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("business-purpose", filename=_FIXED_FILENAME, name=payload.name)
    return {"ok": True}
