#!/usr/bin/env python3

from datetime import datetime
import logging
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel
import yaml

from backend.auth.role_mgmt_impl import RoleMgmtImpl
from backend.dependencies import get_current_user


rolemgmtimpl = RoleMgmtImpl.get_instance()


def execute_role_operation(operation: Callable[[], None], operation_name: str) -> Dict[str, Any]:
    """Execute a role management operation with standardized error handling.

    This helper handles common error patterns:
    - Success -> Returns success response
    - ValueError -> 400 Bad Request (validation/business rule errors)
    - Exception -> 500 Internal Server Error (unexpected failures)

    Args:
        operation: The operation to execute (callable with no args)
        operation_name: Human-readable operation name for error messages (e.g., "assigned", "unassigned")

    Returns:
        Success response dict with status and message

    Raises:
        HTTPException: On validation or server errors
    """
    try:
        operation()
        return {
            "status": "success",
            "message": f"Role {operation_name} successfully",
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "message": str(ve)},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "error", "message": f"Internal server error while {operation_name.replace('ed', 'ing')} role"},
        )


def create_rolemgmt_router(
    *,
    enforce: Callable[[Dict[str, Any], str, str, Optional[Dict[str, Any]]], None],
    get_current_user_context: Callable[..., Dict[str, Any]]
) -> APIRouter:

    router = APIRouter(tags=["RoleManagement"])
    logger = logging.getLogger("RoleManagementAPI")

    class RoleAssignmentRequest(BaseModel):
        product: str
        role: str
        userid: Optional[str] = None
        group: Optional[str] = None


    class GlobalRoleAssignmentRequest(BaseModel):
        group: str
        role: str


    class UserGlobalRoleAssignmentRequest(BaseModel):
        user: str
        role: str


    def get_grantor(request: Request) -> Optional[str]:
        return get_current_user(request)

    @router.get("/role-management/rbac/refresh")
    def refresh_rbac_roles() -> Dict[str, Any]:
        try:
            rolemgmtimpl.update_roles(force=True)
            return {
                "status": "success",
                "message": "Role refreshed successfully",
            }
        except Exception as e:
            # Unexpected failures
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "status": "error",
                    "message": "Internal server error while refreshing role",
                },
            )

    @router.get("/role-management/product")
    def list_product_roles() -> Dict[str, Any]:
        group_rows = rolemgmtimpl.get_grp2products2roles()
        user_rows = rolemgmtimpl.get_user2products2roles()
        return {
            "rows": group_rows,
            "group_rows": group_rows,
            "user_rows": user_rows,
        }


    @router.get("/role-management/users")
    def list_users_and_roles(
        user_context: Dict[str, Any] = Depends(get_current_user_context),
    ) -> Dict[str, Any]:
        enforce(user_context, "/role-management/users", "GET", {})

        users = rolemgmtimpl.list_all_users()
        rows = [rolemgmtimpl.get_user_roles_snapshot(u) for u in users]
        rows.sort(key=lambda r: str(r.get("userid") or "").lower())
        return {"rows": rows}


    @router.post("/role-management/product/assign")
    def assign_role(payload: RoleAssignmentRequest,
                    grantor: Optional[str] = Depends(get_grantor),
                    user_context: Dict[str, Any] = Depends(get_current_user_context)) -> Dict[str, Any]:
        enforce(user_context, "/role-management/product/assign", "POST", {})
        userid = str(payload.userid or "").strip()
        group = str(payload.group or "").strip()
        if bool(userid) == bool(group):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"status": "error", "message": "Exactly one of userid or group is required"},
            )
        result = execute_role_operation(
            (lambda: rolemgmtimpl.add_user2products2roles(grantor, userid, payload.product, payload.role))
            if userid
            else (lambda: rolemgmtimpl.add_grp2products2roles(grantor, group, payload.product, payload.role)),
            "assigned"
        )
        try:
            store_path = (Path.home() / "workspace" / "fwconfigfiles" / "temp" / "accessrequests.yaml")
            raw = None
            if store_path.exists() and store_path.is_file():
                loaded = yaml.safe_load(store_path.read_text())
                if isinstance(loaded, dict):
                    raw = loaded
            if isinstance(raw, dict):
                matches: List[Tuple[str, Dict[str, object]]] = []
                for k, v in raw.items():
                    if not isinstance(k, str) or not isinstance(v, dict):
                        continue
                    if str(v.get("type") or "").strip() != "product_access":
                        continue
                    p = v.get("payload")
                    if not isinstance(p, dict):
                        continue
                    if str(p.get("product") or "").strip() != str(payload.product or "").strip():
                        continue
                    if userid and str(p.get("userid") or "").strip() != userid:
                        continue
                    if group and str(p.get("group") or "").strip() != group:
                        continue
                    matches.append((k, v))

                if matches:
                    def _requested_at(key: str) -> str:
                        return str(key.split(":", 1)[0] if ":" in key else "")

                    matches.sort(key=lambda kv: _requested_at(kv[0]), reverse=True)
                    k, v = matches[0]
                    v = dict(v)
                    p = dict(v.get("payload") or {})
                    p["product"] = str(payload.product or "").strip()
                    p["role"] = str(payload.role or "").strip()
                    if userid:
                        p["userid"] = userid
                        p.pop("group", None)
                    else:
                        p["group"] = group
                        p.pop("userid", None)
                    v["payload"] = p
                    v["status"] = "granted"
                    v["granted_by"] = str(grantor or "").strip() or "unknown"
                    v["granted_at"] = datetime.now().astimezone().isoformat()
                    raw[k] = v
                    store_path.write_text(yaml.safe_dump(raw, sort_keys=False))
        except Exception:
            pass

        return result


    @router.post("/role-management/product/unassign")
    def unassign_role(payload: RoleAssignmentRequest,
                      grantor: Optional[str] = Depends(get_grantor),
                    user_context: Dict[str, Any] = Depends(get_current_user_context)) -> Dict[str, Any]:
        enforce(user_context, "/role-management/product/unassign", "POST", {})
        userid = str(payload.userid or "").strip()
        group = str(payload.group or "").strip()
        if bool(userid) == bool(group):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"status": "error", "message": "Exactly one of userid or group is required"},
            )
        return execute_role_operation(
            (lambda: rolemgmtimpl.del_user2products2roles(grantor, userid, payload.product, payload.role))
            if userid
            else (lambda: rolemgmtimpl.del_grp2products2roles(grantor, group, payload.product, payload.role)),
            "unassigned"
        )


    @router.get("/role-management/groupglobal")
    def list_groupglobal_roles() -> Dict[str, Any]:
        rows = rolemgmtimpl.get_grps2globalroles()
        return {"rows": rows}


    @router.post("/role-management/groupglobal/assign",
                 summary="Assign roles for groups ",
                 description="""{
      "group": "sysgrp",
      "role": "viewall", "role_mgmt_admin"
      ]
    }""")
    def assign_groupglobal_role(payload: GlobalRoleAssignmentRequest,
                                grantor: Optional[str] = Depends(get_grantor),
                    user_context: Dict[str, Any] = Depends(get_current_user_context)) -> Dict[str, Any]:
        enforce(user_context, "/role-management/groupglobal/assign", "POST", {})
        return execute_role_operation(
            lambda: rolemgmtimpl.add_grps2globalroles(grantor, payload.group, payload.role),
            "assigned"
        )


    @router.post("/role-management/groupglobal/unassign",
                 summary="Unassign roles for groups ",
                 description="""{
      "group": "sysgrp",
      "role": "viewall", "role_mgmt_admin"
      ]
    }""")
    def unassign_groupglobal_role(payload: GlobalRoleAssignmentRequest,
                                  grantor: Optional[str] = Depends(get_grantor),
                    user_context: Dict[str, Any] = Depends(get_current_user_context)) -> Dict[str, Any]:
        enforce(user_context, "/role-management/groupglobal/unassign", "POST", {})
        return execute_role_operation(
            lambda: rolemgmtimpl.del_grps2globalroles(grantor, payload.group, payload.role),
            "unassigned"
        )


    @router.get("/role-management/userglobal",
                 summary="Get the list of roles that govern user access across the portal",
                 description="""""")
    def list_userglobal_roles() -> Dict[str, Any]:
        rows = rolemgmtimpl.get_users2globalroles()
        return {"rows": rows}


    @router.get("/role-management/user/roles")
    def lookup_user_roles(
        userid: str,
        user_context: Dict[str, Any] = Depends(get_current_user_context),
    ) -> Dict[str, Any]:
        enforce(user_context, "/role-management/user/roles", "GET", {})

        user_id = str(userid or "").strip()
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"status": "error", "message": "userid is required"},
            )

        groups = rolemgmtimpl.get_user_groups(user_id)

        user_global_map = rolemgmtimpl.get_users2globalroles()
        group_global_map = rolemgmtimpl.get_grps2globalroles()
        user_product_map = rolemgmtimpl.get_user2products2roles()
        group_product_map = rolemgmtimpl.get_grp2products2roles()

        user_global_roles = user_global_map.get(user_id) if isinstance(user_global_map, dict) else None
        if not isinstance(user_global_roles, list):
            user_global_roles = []

        group_global_roles: Dict[str, List[str]] = {}
        if isinstance(group_global_map, dict):
            for g in groups:
                roles = group_global_map.get(g)
                if isinstance(roles, list):
                    group_global_roles[g] = [str(r).strip() for r in roles if str(r).strip()]

        user_product_roles = user_product_map.get(user_id) if isinstance(user_product_map, dict) else None
        if not isinstance(user_product_roles, dict):
            user_product_roles = {}

        group_product_roles: Dict[str, Dict[str, List[str]]] = {}
        if isinstance(group_product_map, dict):
            for g in groups:
                amap = group_product_map.get(g)
                if not isinstance(amap, dict):
                    continue
                next_amap: Dict[str, List[str]] = {}
                for product, roles in amap.items():
                    if not isinstance(roles, list):
                        continue
                    next_amap[str(product)] = [str(r).strip() for r in roles if str(r).strip()]
                if next_amap:
                    group_product_roles[g] = next_amap

        combined_product_roles = rolemgmtimpl.get_product_roles(groups, user_id)
        combined_global_roles = rolemgmtimpl.get_user_roles(user_id, groups)

        return {
            "userid": user_id,
            "groups": groups,
            "user_global_roles": [str(r).strip() for r in user_global_roles if str(r).strip()],
            "group_global_roles": group_global_roles,
            "user_product_roles": user_product_roles,
            "group_product_roles": group_product_roles,
            "combined_global_roles": combined_global_roles,
            "combined_product_roles": combined_product_roles,
        }


    @router.post("/role-management/userglobal/assign",
                 summary="Assign roles for users ",
                 description="""{
      "user": "user1",
      "role": "viewall", "role_mgmt_admin"
      ]
    }""")
    def assign_userglobal_role(payload: UserGlobalRoleAssignmentRequest,
                               grantor: Optional[str] = Depends(get_grantor),
                    user_context: Dict[str, Any] = Depends(get_current_user_context)) -> Dict[str, Any]:
        enforce(user_context, "/role-management/userglobal/assign", "POST", {})
        return execute_role_operation(
            lambda: rolemgmtimpl.add_users2globalroles(grantor, payload.user, payload.role),
            "assigned"
        )


    @router.post("/role-management/userglobal/unassign",
                 summary="Unassign roles for users ",
                 description="""{
      "user": "user1",
      "role": "viewall", "role_mgmt_admin"
      ]
    }""")
    def unassign_userglobal_role(payload: UserGlobalRoleAssignmentRequest,
                                 grantor: Optional[str] = Depends(get_grantor),
                    user_context: Dict[str, Any] = Depends(get_current_user_context)) -> Dict[str, Any]:
        enforce(user_context, "/role-management/userglobal/unassign", "POST", {})
        return execute_role_operation(
            lambda: rolemgmtimpl.del_users2globalroles(grantor, payload.user, payload.role),
            "unassigned"
        )


    return router
