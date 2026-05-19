"""API routes for env YAML type."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.services.env_service import EnvService

router = APIRouter(prefix="/api/v1/infra/env", tags=["env"])


def get_service() -> EnvService:
    return EnvService()

@router.get("")
def list_items(request: Request, service: EnvService = Depends(get_service)):
    rows = service.list_items()
    return {"type": "env", "items": rows}


@router.post("")
def save_item(
    request: Request,
    name: str,
    service: EnvService = Depends(get_service),
) -> Dict[str, Any]:
    service.save_item(name=name)
    return {"ok": True}


@router.delete("")
def delete_item(
    request: Request,
    name: str,
    service: EnvService = Depends(get_service),
) -> Dict[str, Any]:
    service.delete_item(name=name)
    return {"ok": True}
