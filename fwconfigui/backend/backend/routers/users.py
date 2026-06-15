"""API routes for current user and demo user switching."""

import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from backend.auth.rbac import get_user_context
from backend.auth.role_mgmt_impl import RoleMgmtImpl, is_demo_mode
from backend.dependencies import get_current_user

router = APIRouter(prefix="/api/v1", tags=["users"])


class CurrentUserUpdateRequest(BaseModel):
    user: Optional[str] = None
    userid: Optional[str] = None
    username: Optional[str] = None


def _user_context_response(user_id: str) -> Dict[str, Any]:
    ctx = get_user_context(user_id)
    return {
        "username": ctx.get("username", user_id),
        "user": ctx.get("username", user_id),
        "roles": ctx.get("roles", []),
        "groups": ctx.get("groups", []),
        "product_roles": ctx.get("product_roles", {}),
    }


def _resolve_user_id(payload: CurrentUserUpdateRequest) -> str:
    for value in (payload.user, payload.userid, payload.username):
        user_id = str(value or "").strip()
        if user_id:
            return user_id
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="user, userid, or username is required",
    )


def _demo_users_path() -> Path:
    workspace_raw = str(os.getenv("WORKSPACE", "") or "").strip()
    if workspace_raw:
        workspace = Path(workspace_raw).expanduser()
    else:
        workspace = Path.home() / "workspace"
    return workspace / "fwconfigfiles" / "control" / "rbac" / "demo_mode" / "demo_users.yaml"


@router.get("/current-user")
def get_current_user_info(request: Request, user_id: Optional[str] = Depends(get_current_user)) -> Dict[str, Any]:
    return _user_context_response(str(user_id or ""))


@router.put("/current-user")
def set_current_user(payload: CurrentUserUpdateRequest) -> Dict[str, Any]:
    if not is_demo_mode():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Switching current user is only allowed when DEMO_MODE=true",
        )

    user_id = _resolve_user_id(payload)
    os.environ["CURRENT_USER"] = user_id
    RoleMgmtImpl.get_instance().update_roles(force=True)
    return _user_context_response(user_id)


@router.get("/demo-users")
def list_demo_users() -> Any:
    path = _demo_users_path()
    if not path.exists() or not path.is_file():
        return []

    try:
        raw = yaml.safe_load(path.read_text())
    except Exception:
        return []

    if raw is None:
        return []
    return raw
