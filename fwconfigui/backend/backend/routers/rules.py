from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.services.rules_service import RulesService

router = APIRouter(prefix="/api/v1/products/{product}/rules/{env}", tags=["rules"])


def get_service(product: str) -> RulesService:
    return RulesService(product)


@router.get("")
def list_items(
    request: Request,
    product: str,
    env: str,
    service: RulesService = Depends(get_service),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, f"/products/{product}/rules", "GET", {"id": product})
    items = service.list_items(env=env)
    return {"type": "rules", "env": env, "items": items}
