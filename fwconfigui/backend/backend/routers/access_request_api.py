"""API routes for access requests."""

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/v1", tags=["access-requests"])


def get_access_requests_store_path() -> Path:
    workspace_raw = str(os.getenv("WORKSPACE", "") or "").strip()
    if workspace_raw:
        base = Path(workspace_raw).expanduser()
    else:
        base = Path.home() / "workspace"
    return base / "fwconfigfiles" / "temp" / "accessrequests.yaml"


def _ensure_store_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _load_access_requests() -> Dict[str, Any]:
    path = get_access_requests_store_path()
    if not path.exists() or not path.is_file():
        return {}
    try:
        raw = yaml.safe_load(path.read_text())
        if isinstance(raw, dict):
            return raw
    except Exception:
        pass
    return {}


def _save_access_requests(data: Dict[str, Any]) -> None:
    path = get_access_requests_store_path()
    _ensure_store_parent(path)
    path.write_text(yaml.safe_dump(data, sort_keys=False))


def _generate_request_id() -> str:
    ts = datetime.now().astimezone().strftime("%Y-%m-%dT%H-%M-%S%f")
    return f"{ts}:{uuid.uuid4().hex[:8]}"


def _sort_key_for_record(request_id: str, record: Dict[str, Any]) -> str:
    requested_at = str(record.get("requested_at") or "").strip()
    if requested_at:
        return requested_at
    return str(request_id)


class ProductAccessRequest(BaseModel):
    product: str
    role: str
    userid: Optional[str] = None
    group: Optional[str] = None


class GlobalAccessRequest(BaseModel):
    role: str
    user: Optional[str] = None
    group: Optional[str] = None


@router.get("/access_requests")
def list_access_requests(
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> List[Dict[str, Any]]:
    enforce_request(user_context, "/access_requests", "GET", {})

    raw = _load_access_requests()
    if not raw:
        return []

    items: List[Dict[str, Any]] = []
    for request_id, record in raw.items():
        if not isinstance(request_id, str) or not isinstance(record, dict):
            continue
        item = dict(record)
        item["id"] = request_id
        items.append(item)

    items.sort(key=lambda r: _sort_key_for_record(str(r.get("id") or ""), r), reverse=True)
    return items


@router.post("/product_access")
def request_product_access(
    payload: ProductAccessRequest,
    requester: Optional[str] = Depends(get_current_user),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/product_access", "POST", {})

    product = str(payload.product or "").strip()
    role = str(payload.role or "").strip()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "message": "product is required"},
        )
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "message": "role is required"},
        )

    userid = str(payload.userid or "").strip()
    group = str(payload.group or "").strip()
    if userid and group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "message": "Only one of userid or group may be provided"},
        )
    if not userid and not group:
        userid = str(requester or "").strip()
        if not userid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"status": "error", "message": "userid is required when current user is unknown"},
            )

    requested_at = datetime.now().astimezone().isoformat()
    access_payload: Dict[str, Any] = {
        "product": product,
        "role": role,
    }
    if userid:
        access_payload["userid"] = userid
    else:
        access_payload["group"] = group

    record: Dict[str, Any] = {
        "type": "product_access",
        "status": "pending",
        "requested_by": str(requester or "").strip() or "unknown",
        "requested_at": requested_at,
        "payload": access_payload,
    }

    request_id = _generate_request_id()
    store = _load_access_requests()
    store[request_id] = record
    _save_access_requests(store)

    return {
        "status": "success",
        "request_id": request_id,
        "request": record,
    }


@router.post("/global_access")
def request_global_access(
    payload: GlobalAccessRequest,
    requester: Optional[str] = Depends(get_current_user),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/global_access", "POST", {})

    role = str(payload.role or "").strip()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "message": "role is required"},
        )

    user = str(payload.user or "").strip()
    group = str(payload.group or "").strip()
    if user and group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "message": "Only one of user or group may be provided"},
        )
    if not user and not group:
        user = str(requester or "").strip()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"status": "error", "message": "user is required when current user is unknown"},
            )

    requested_at = datetime.now().astimezone().isoformat()
    access_payload: Dict[str, Any] = {"role": role}
    if user:
        access_payload["user"] = user
    else:
        access_payload["group"] = group

    record: Dict[str, Any] = {
        "type": "global_access",
        "status": "pending",
        "requested_by": str(requester or "").strip() or "unknown",
        "requested_at": requested_at,
        "payload": access_payload,
    }

    request_id = _generate_request_id()
    store = _load_access_requests()
    store[request_id] = record
    _save_access_requests(store)

    return {
        "status": "success",
        "request_id": request_id,
        "request": record,
    }
