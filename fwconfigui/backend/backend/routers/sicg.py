"""API routes for SICG CSV uploads."""

from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from backend.auth.rbac import enforce_request, get_current_user_context
from backend.utils.workspace import get_fwconfigfiles_root

router = APIRouter(prefix="/api/v1/sicg", tags=["sicg"])


async def _read_csv_upload(file: Optional[UploadFile], *, expected_filename: str) -> bytes:
    if file is None:
        raise HTTPException(status_code=400, detail=f"Missing file '{expected_filename}'")

    filename = str(file.filename or "")
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed")

    if filename != expected_filename:
        raise HTTPException(status_code=400, detail=f"Expected filename '{expected_filename}'")

    return await file.read()


def _safe_join_fwconfigfiles(filename: str) -> Path:
    name = str(filename or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Missing filename")
    if "/" in name or "\\" in name:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return Path(get_fwconfigfiles_root()) / name


@router.post("/upload")
async def upload_sicg(
    file: UploadFile = File(...),
    user_context: Dict[str, Any] = Depends(get_current_user_context),
) -> Dict[str, Any]:
    enforce_request(user_context, "/products", "POST", {})
    filename = str(file.filename or "").strip()
    if filename not in {"sicg_components.csv", "sicg_flows.csv"}:
        raise HTTPException(status_code=400, detail="Filename must be sicg_components.csv or sicg_flows.csv")
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed")

    content = await file.read()
    out_path = _safe_join_fwconfigfiles(filename)
    out_path.write_bytes(content)

    return {"ok": True, "filename": filename, "bytes": len(content)}
