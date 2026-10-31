from typing import Any, Dict, Optional

import yaml
from fastapi import APIRouter, Body, Depends, Request

from backend.exceptions.custom import NotFoundError, ValidationError
from backend.models import SaveFwRuleRequest
from backend.services.rules_service import RulesService

router = APIRouter(prefix="/api/v1/products/{product}/rules/{env}", tags=["rules"])


def get_service(product: str) -> RulesService:
    return RulesService(product)


@router.get("")
def list_items(request: Request, product: str, env: str, service: RulesService = Depends(get_service)) -> Dict[str, Any]:
    items = service.list_items(env=env)
    return {"type": "rules", "env": env, "items": items}


@router.post("")
def save_item(
    request: Request,
    product: str,
    env: str,
    payload: SaveFwRuleRequest = Body(...),
    service: RulesService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(payload.filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")
    name = str(payload.name or "").strip()
    if not name:
        raise ValidationError("name", "is required")
    service.save_rule(env=env, filename=file_name, name=name, data=dict(payload.data or {}), create=True)
    return {"ok": True}


@router.put("")
def update_item(
    request: Request,
    product: str,
    env: str,
    payload: SaveFwRuleRequest = Body(...),
    service: RulesService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(payload.filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")
    original = str(payload.original_name or "").strip()
    if not original:
        raise ValidationError("original_name", "is required for update")
    name = str(payload.name or "").strip()
    if not name:
        raise ValidationError("name", "is required")
    service.save_rule(env=env, filename=file_name, name=name, data=dict(payload.data or {}), original_name=original)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    product: str,
    env: str,
    name: str,
    filename: Optional[str] = None,
    service: RulesService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")
    service.delete_rule(env=env, filename=file_name, name=str(name or "").strip())
    return {"ok": True}


@router.get("/yaml")
def get_rule_yaml(
    request: Request,
    product: str,
    env: str,
    filename: str,
    appflowid: Optional[str] = None,
    service: RulesService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")
    key = str(appflowid or "").strip()
    if not key:
        raise ValidationError("appflowid", "is required")
    rule = service.get_rule(env=env, filename=file_name, name=key)
    txt = yaml.safe_dump(rule, sort_keys=False)
    return {"filename": file_name, "appflowid": key, "yaml": txt}


@router.put("/yaml")
def put_rule_yaml(
    request: Request,
    product: str,
    env: str,
    filename: str,
    appflowid: Optional[str] = None,
    yaml_text: str = Body(..., embed=True),
    service: RulesService = Depends(get_service),
) -> Dict[str, Any]:
    file_name = str(filename or "").strip()
    if not file_name:
        raise ValidationError("filename", "is required")
    key = str(appflowid or "").strip()
    if not key:
        raise ValidationError("appflowid", "is required")

    try:
        parsed = yaml.safe_load(yaml_text) or {}
    except Exception:
        raise ValidationError("yaml", "invalid YAML")
    if not isinstance(parsed, dict):
        raise ValidationError("yaml", "must be a YAML object")

    next_name = str(parsed.get("name") or parsed.get("appflowid") or "").strip()
    if next_name != key:
        raise ValidationError("data.name", "cannot change name in update")

    service.replace_rule(env=env, filename=file_name, name=key, data=parsed)
    return {"ok": True, "appflowid": key, "filename": file_name}
