"""API routes for port-protocol YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import DeleteItemRequest, ListItemsResponse, ListYamlFilesResponse, SaveItemRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/fwconfig/port-protocol", tags=["fwconfig", "port-protocol"])

_FIXED_FILENAME = "port-protocol.yaml"


def get_service() -> FwConfigService:
    return FwConfigService()


@router.get("/files", response_model=ListYamlFilesResponse)
def list_yaml_files(request: Request, service: FwConfigService = Depends(get_service)):
    files = [{"filename": _FIXED_FILENAME}]
    return {"type": "port-protocol", "files": files}


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, service: FwConfigService = Depends(get_service)):
    items = [x for x in service.list_items("port-protocol") if str(x.get("filename", "")) == _FIXED_FILENAME]
    return {"type": "port-protocol", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    name = str(payload.name or "").strip().lower()
    data = dict(payload.data or {})
    data["name"] = str(data.get("name", "") or name).strip().lower()
    service.save_port_protocol(filename=_FIXED_FILENAME, name=name, data=data, original_name=payload.original_name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("port-protocol", filename=_FIXED_FILENAME, name=payload.name)
    return {"ok": True}
