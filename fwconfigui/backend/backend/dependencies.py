"""Shared FastAPI dependencies."""

from backend.services.common_service import get_current_user, get_deployment_type

__all__ = ["get_current_user", "get_deployment_type"]
