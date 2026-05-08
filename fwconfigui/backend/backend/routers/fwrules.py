"""API routes for fw-rules YAML type."""

from typing import Any, Dict, Optional

import re
import yaml
from fastapi import APIRouter, Body, Depends, Request

from backend.exceptions.custom import NotFoundError, ValidationError
from backend.models import DeleteItemRequest, ListItemsResponse, ListYamlFilesResponse, SaveItemRequest
from backend.repositories.fwconfig_repository import FwConfigRepository
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/fwconfig/fw-rules", tags=["fwconfig", "fw-rules"])


def get_service() -> FwConfigService:
    return FwConfigService()


@router.get("/files", response_model=ListYamlFilesResponse)
def list_yaml_files(request: Request, service: FwConfigService = Depends(get_service)):
    files = [{"filename": f} for f in service.list_files("fw-rules")]
    return {"type": "fw-rules", "files": files}


@router.get("", response_model=ListItemsResponse)
def list_items(request: Request, service: FwConfigService = Depends(get_service)):
    items = service.list_items("fw-rules")
    return {"type": "fw-rules", "items": items}


@router.post("")
def save_item(
    request: Request,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    name = str(payload.name or "").strip().upper()
    name = re.sub(r"[^A-Z0-9_-]", "", name)
    data = dict(payload.data or {})
    data["appflowid"] = str(data.get("appflowid", "") or name).strip().upper()
    data["appflowid"] = re.sub(r"[^A-Z0-9_-]", "", data["appflowid"])
    service.save_item(
        "fw-rules",
        filename=payload.filename,
        name=name,
        data=data,
        original_name=payload.original_name,
    )
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    payload: DeleteItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item("fw-rules", filename=payload.filename, name=payload.name)
    return {"ok": True}


@router.get("/yaml")
def get_rule_yaml(
    request: Request,
    filename: str,
    appflowid: Optional[str] = None,
) -> Dict[str, Any]:
    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")

    key = str(appflowid or "").strip().upper()
    key = re.sub(r"[^A-Z0-9_-]", "", key)
    if not key:
        raise ValidationError("appflowid", "is required")

    # Find entry
    for fn, entry in FwConfigRepository.read_items("fw-rules"):
        if fn != file_name:
            continue
        if not isinstance(entry, dict):
            continue

        entry_appflowid = str(entry.get("appflowid", "") or "").strip()
        if key == entry_appflowid:
            txt = yaml.safe_dump(entry, sort_keys=False)
            return {"filename": file_name, "appflowid": entry_appflowid, "yaml": txt}

    raise NotFoundError("Item", key)


@router.put("/yaml")
def put_rule_yaml(
    request: Request,
    filename: str,
    appflowid: Optional[str] = None,
    yaml_text: str = Body(..., embed=True),
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")

    key = str(appflowid or "").strip().upper()
    key = re.sub(r"[^A-Z0-9_-]", "", key)
    if not key:
        raise ValidationError("appflowid", "is required")

    # Update-only: the referenced appflowid must already exist in the given file.
    found_existing = False
    for fn, entry in FwConfigRepository.read_items("fw-rules"):
        if fn != file_name:
            continue
        if not isinstance(entry, dict):
            continue
        entry_appflowid = str(entry.get("appflowid", "") or "").strip().upper()
        entry_appflowid = re.sub(r"[^A-Z0-9_-]", "", entry_appflowid)
        if entry_appflowid == key:
            found_existing = True
            break

    if not found_existing:
        raise NotFoundError("Item", key)

    try:
        parsed = yaml.safe_load(yaml_text) or {}
    except Exception:
        raise ValidationError("yaml", "invalid YAML")

    if not isinstance(parsed, dict):
        raise ValidationError("yaml", "must be a YAML object")

    next_appflowid = str(parsed.get("appflowid", "") or "").strip().upper()
    next_appflowid = re.sub(r"[^A-Z0-9_-]", "", next_appflowid)
    if not next_appflowid:
        raise ValidationError("data.appflowid", "is required")

    # Ensure we don't persist a separate name field for flowtemplates.
    parsed.pop("name", None)

    service.save_item("fw-rules", filename=file_name, name=next_appflowid, data=parsed)

    # If appflowid changed, delete old entry.
    if key != next_appflowid:
        try:
            service.delete_item("fw-rules", filename=file_name, name=key)
        except Exception:
            pass

    return {"ok": True, "appflowid": next_appflowid}
