"""API routes for fw-rules YAML type."""

from typing import Any, Dict, Optional

import re
import yaml
from fastapi import APIRouter, Body, Depends, Request

from backend.exceptions.custom import NotFoundError, ValidationError
from backend.models import (
    DeleteItemRequest,
    ListItemsResponse,
    ListYamlFilesResponse,
    MoveFwRuleRequest,
    SaveItemRequest,
    UpdateFwRuleFieldsRequest,
)
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
    filename: str,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")

    name = str(payload.name or "").strip().upper()
    name = re.sub(r"[^A-Z0-9_-]", "", name)
    data = dict(payload.data or {})
    data["appflowid"] = str(data.get("appflowid", "") or name).strip().upper()
    data["appflowid"] = re.sub(r"[^A-Z0-9_-]", "", data["appflowid"])
    service.save_fw_rules(
        filename=file_name,
        name=name,
        data=data,
        original_name=payload.original_name,
    )
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    filename: str,
    payload: SaveItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    """Update an existing fw-rule.

    PUT is used for edit/update semantics (record must already exist).
    It also supports rename and moving between files by deleting the original
    record (as identified by original_name) after saving the new payload.
    """

    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")

    original = str(payload.original_name or "").strip().upper()
    original = re.sub(r"[^A-Z0-9_-]", "", original)
    if not original:
        raise ValidationError("original_name", "is required for update")

    found_filename = FwConfigRepository.find_item_file("fw-rules", original)
    if not found_filename:
        raise NotFoundError("Item", original)

    name = str(payload.name or "").strip().upper()
    name = re.sub(r"[^A-Z0-9_-]", "", name)
    data = dict(payload.data or {})
    data["appflowid"] = str(data.get("appflowid", "") or name).strip().upper()
    data["appflowid"] = re.sub(r"[^A-Z0-9_-]", "", data["appflowid"])

    # Save (upsert) into the requested file.
    service.save_fw_rules(
        filename=file_name,
        name=name,
        data=data,
        original_name=original,
    )

    # Delete the original record if it was renamed and/or moved.
    if file_name != found_filename or name != original:
        try:
            service.repo.delete_item("fw-rules", filename=found_filename, name=original)
        except Exception:
            # Best-effort cleanup; save already succeeded.
            pass

    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    filename: str,
    payload: DeleteItemRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")
    service.delete_item("fw-rules", filename=file_name, name=payload.name)
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

    # Update-only: the referenced appflowid must already exist in some fw-rules file.
    found_filename = None
    for fn, entry in FwConfigRepository.read_items("fw-rules"):
        if not isinstance(entry, dict):
            continue
        entry_appflowid = str(entry.get("appflowid", "") or "").strip().upper()
        entry_appflowid = re.sub(r"[^A-Z0-9_-]", "", entry_appflowid)
        if entry_appflowid == key:
            found_filename = fn
            break

    if not found_filename:
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
    if next_appflowid != key:
        raise ValidationError("data.appflowid", "cannot change appflowid in update")

    # Ensure we don't persist a separate name field for flowtemplates.
    parsed.pop("name", None)

    service.save_fw_rules(filename=found_filename, name=next_appflowid, data=parsed, original_name=key)
    return {"ok": True, "appflowid": next_appflowid, "filename": found_filename}


@router.put("/fields")
def put_rule_fields(
    request: Request,
    payload: UpdateFwRuleFieldsRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    filename, _ = service.update_fw_rule_fields(
        appflowid=payload.appflowid,
        protocol_port_reference=payload.protocol_port_reference,
        business_purpose_reference=payload.business_purpose_reference,
        keywords=payload.keywords,
        envs=payload.envs,
    )
    return {"ok": True, "filename": filename}


@router.put("/move")
def put_move_rule(
    request: Request,
    payload: MoveFwRuleRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    service.move_fw_rule(appflowid=payload.appflowid, from_filename=payload.from_filename, to_filename=payload.to_filename)
    return {"ok": True}


@router.post("/commit")
def commit_validate_rules(
    request: Request,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    errors = service.validate_fw_rules_commit()
    return {"ok": len(errors) == 0, "errors": errors}
