"""Shared FastAPI dependencies."""

from typing import Optional

from backend.exceptions.custom import ValidationError
from backend.utils.workspace import get_fwconfigfiles_root


def require_yaml_type(yaml_type: Optional[str]) -> str:
    """Validate and normalize yaml_type query parameter."""

    if not yaml_type:
        raise ValidationError("type", "Missing required query parameter: type")

    normalized = str(yaml_type).strip().lower()
    allowed = {"fw-rules", "port-protocol", "business-purpose", "env"}
    if normalized not in allowed:
        raise ValidationError("type", f"Invalid type '{normalized}'. Allowed: {', '.join(sorted(allowed))}")

    return normalized


def require_initialized_root():
    """Ensure fwconfigfiles root exists and is accessible."""

    return get_fwconfigfiles_root()
