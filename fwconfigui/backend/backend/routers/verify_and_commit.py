"""API routes for fw-rules verify-and-commit."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from backend.exceptions.custom import ValidationError
from backend.models import VerifyAndCommitRequest
from backend.services.fwconfig_service import FwConfigService

router = APIRouter(prefix="/api/v1/products/{product}/rule-templates", tags=["fw-rules"])


def get_service(product: str) -> FwConfigService:
    return FwConfigService(product)


@router.post("/verify_and_commit")
def verify_and_commit_rules(
    request: Request,
    product: str,
    payload: VerifyAndCommitRequest,
    service: FwConfigService = Depends(get_service),
) -> Dict[str, Any]:
    mode = str(payload.mode or "").strip().lower()
    if mode not in {"verify-only", "verify and commit", "verify-and-commit"}:
        raise ValidationError("mode", "must be one of: verify-only, verify-and-commit")

    raw_envs = payload.envs if isinstance(payload.envs, list) else None
    envs = [str(x or "").strip() for x in (raw_envs or [])]
    envs = [e for e in envs if e]
    if len(envs) == 1 and envs[0].strip().lower() == "all":
        envs = []

    errors = service.validate_fw_rules_commit(envs=envs or None)
    ok = len(errors) == 0

    # NOTE: currently the backend only validates; committing is handled outside of this service.
    committed = ok and mode in {"verify and commit", "verify-and-commit"}
    return {"ok": ok, "errors": errors, "mode": mode, "committed": committed}
