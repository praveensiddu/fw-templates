"""API routes for Home tab tool settings."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.models import SaveHomeSettingsRequest
from backend.services.home_service import HomeService

router = APIRouter(prefix="/api/v1/home", tags=["home"])


def get_service() -> HomeService:
    """Dependency injection for HomeService."""
    return HomeService()


@router.get("/settings")
def get_settings(request: Request, service: HomeService = Depends(get_service)) -> Dict[str, Any]:
    """Get current Home tool settings.

    Returns:
        Mapping of setting name to value under 'settings', and 'initialized'
        which is True once ~/.fwconfig/fwconfig.yaml exists
    """
    return {"settings": service.get_settings(), "initialized": service.is_initialized()}


@router.put("/settings")
def save_settings(
    request: Request,
    payload: SaveHomeSettingsRequest,
    service: HomeService = Depends(get_service),
) -> Dict[str, Any]:
    """Save Home tool settings.

    Returns:
        The normalized settings that were saved under 'settings', and
        'initialized' which is True once ~/.fwconfig/fwconfig.yaml exists
    """
    return {
        "settings": service.save_settings(settings=payload.settings.model_dump()),
        "initialized": service.is_initialized(),
    }


@router.get("/samples")
def get_samples(request: Request, service: HomeService = Depends(get_service)) -> Dict[str, Any]:
    """Get pre-prepared sample Home settings.

    Returns:
        Mapping of setting name to sample value under 'settings'
    """
    return {"settings": service.get_samples()}
