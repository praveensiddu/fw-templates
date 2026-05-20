"""Shared FastAPI dependencies."""

import os
from typing import Optional

from fastapi import Request

from backend.exceptions.custom import ValidationError


def require_yaml_type(yaml_type: Optional[str]) -> str:
    """Validate and normalize yaml_type query parameter."""

    if not yaml_type:
        raise ValidationError("type", "Missing required query parameter: type")

    normalized = str(yaml_type).strip().lower()
    allowed = {"fw-rules", "port-protocol", "business-purpose", "env", "keywords"}
    if normalized not in allowed:
        raise ValidationError("type", f"Invalid type '{normalized}'. Allowed: {', '.join(sorted(allowed))}")

    return normalized


def get_current_user(request: Request) -> str | None:
    deployment_type = str(os.getenv("DEPLOYMENT_TYPE", "") or "").strip().lower()
    if deployment_type == "test":
        return str(os.getenv("CURRENT_USER", "") or "").strip() or None

    headers = request.headers
    for key in (
        "x-user",
        "x-userid",
        "x-forwarded-user",
        "x-authenticated-user",
        "x-auth-request-user",
        "x-auth-request-email",
    ):
        v = str(headers.get(key) or "").strip()
        if v:
            return v
    return None
