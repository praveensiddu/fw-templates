from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.services.rules_service import RulesService

router = APIRouter(prefix="/api/v1/products/{product}/rules/{env}", tags=["rules"])


def get_service(product: str) -> RulesService:
    return RulesService(product)


@router.get("")
def list_items(request: Request, product: str, env: str, service: RulesService = Depends(get_service)) -> Dict[str, Any]:
    items = service.list_items(env=env)
    return {"type": "rules", "env": env, "items": items}
