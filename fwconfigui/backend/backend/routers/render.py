"""API routes for rendering fw-rule templates into env-specific rules."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import RenderRequest
from backend.services.render_service import RenderService

router = APIRouter(prefix="/api/v1/products/{product}/rule-templates", tags=["fw-rules"])


def get_service(product: str) -> RenderService:
    return RenderService(product)


@router.post("/render")
def render_rules(
    request: Request,
    product: str,
    payload: RenderRequest,
    service: RenderService = Depends(get_service),
) -> Dict[str, Any]:
    return service.render(env=str(payload.env or ""))
