"""API routes for fwconfig YAML types."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Request

from backend.dependencies import require_yaml_type
from backend.exceptions.custom import ValidationError
from backend.models import ListItemsResponse, SaveItemRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/fwconfig", tags=["fwconfig"])


def get_service() -> FwConfigService:
    return FwConfigService()


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

    files = service.list_files(yaml_type)
    if len(files) != 1:
        raise ValidationError("filename", f"ambiguous for type '{yaml_type}'")
    filename = files[0]

    if yaml_type == "port-protocol":
        service.save_port_protocol(
            filename=filename,
            name=payload.name,
            data=dict(payload.data or {}),
            original_name=payload.original_name,
        )
    elif yaml_type == "business-purpose":
        service.save_business_purpose(
            filename=filename,
            name=payload.name,
            data=dict(payload.data or {}),
            original_name=payload.original_name,
        )
    elif yaml_type == "fw-rules":
        service.save_fw_rules(
            filename=filename,
            name=payload.name,
            data=dict(payload.data or {}),
            original_name=payload.original_name,
        )
    elif yaml_type == "env":
        service.save_env(
            filename=filename,
            name=payload.name,
            data=dict(payload.data or {}),
            original_name=payload.original_name,
        )
    elif yaml_type == "keywords":
        service.save_keywords(
            filename=filename,
            name=payload.name,
            data=dict(payload.data or {}),
            original_name=payload.original_name,
        )
    else:
        raise ValueError(f"Unsupported yaml_type: {yaml_type}")

    return {"ok": True}


@router.delete("/items")
def delete_item(
    request: Request,
    name: str,
    type: Optional[str] = None,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    yaml_type = require_yaml_type(type)
    files = service.list_files(yaml_type)
    if len(files) != 1:
        raise ValidationError("filename", f"ambiguous for type '{yaml_type}'")
    filename = files[0]
    service.delete_item(yaml_type, filename=filename, name=name)
    return {"ok": True}
