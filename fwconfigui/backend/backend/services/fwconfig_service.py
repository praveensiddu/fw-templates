"""Service for fwconfig YAML CRUD operations."""

import logging
from typing import Any, Dict, List

from backend.exceptions.custom import ResourceInUseError, ValidationError
from backend.repositories.fwconfig_repository import FwConfigRepository

logger = logging.getLogger("uvicorn.error")


class FwConfigService:
    """Business logic for fwconfig YAML entities."""

    def __init__(self):
        self.repo = FwConfigRepository()

    def list_files(self, yaml_type: str) -> List[str]:
        return [p.name for p in self.repo.list_files(yaml_type)]

    def list_items(self, yaml_type: str) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for filename, entry in self.repo.read_items(yaml_type):
            if yaml_type == "fw-rules":
                name = str(entry.get("appflowid", "") or "").strip() or None
            else:
                name = str(entry.get("name", "") or "").strip() or None
            rows.append({"filename": filename, "name": name, "data": entry})
        return rows

    def save_item(self, yaml_type: str, filename: str, name: str, data: Dict[str, Any]) -> None:
        payload = dict(data or {})
        item_key = str(name or "").strip()
        if yaml_type != "fw-rules":
            payload["name"] = item_key

        if yaml_type == "port-protocol":
            pp = payload.get("port-protocol")
            if not isinstance(pp, dict):
                raise ValidationError("data.port-protocol", "must be an object")
            if not str(pp.get("port", "") or "").strip():
                raise ValidationError("data.port-protocol.port", "is required")
            if not str(pp.get("service", "") or "").strip():
                raise ValidationError("data.port-protocol.service", "is required")

        if yaml_type == "business-purpose":
            bp = payload.get("business-purpose")
            if not str(bp or "").strip():
                raise ValidationError("data.business-purpose", "is required")

        if yaml_type == "fw-rules":
            if not str(payload.get("appflowid", "") or "").strip():
                raise ValidationError("data.appflowid", "is required")

            if "business_purpose" in payload:
                raise ValidationError(
                    "data.business_purpose",
                    "is not supported; rename to 'business-purpose-reference'",
                )

            # Use appflowid as the unique key; do not persist a separate name field.
            item_key = str(payload.get("appflowid", "") or "").strip()
            payload.pop("name", None)

        if yaml_type == "env":
            if not str(payload.get("name", "") or "").strip():
                raise ValidationError("name", "is required")

        if yaml_type == "keywords":
            if not str(payload.get("name", "") or "").strip():
                raise ValidationError("name", "is required")

        self.repo.upsert_item(yaml_type, filename=filename, name=item_key, entry=payload)

    def delete_item(self, yaml_type: str, filename: str, name: str) -> None:
        if yaml_type in {"port-protocol", "business-purpose"}:
            refs = self._find_references_in_fw_rules(name)
            if refs:
                logger.warning("Cannot delete %s '%s' - referenced by %s", yaml_type, name, refs)
                raise ResourceInUseError("Item", name, used_by={"fw-rules": refs})

        self.repo.delete_item(yaml_type, filename=filename, name=name)

    def _find_references_in_fw_rules(self, ref_name: str) -> List[Dict[str, str]]:
        if not str(ref_name or "").strip():
            return []
        used_by: List[Dict[str, str]] = []
        for filename, entry in self.repo.read_items("fw-rules"):
            if not isinstance(entry, dict):
                continue
            rules = entry.get("protocol-port-reference")
            bp = entry.get("business-purpose-reference")
            if isinstance(rules, list) and ref_name in [str(x) for x in rules]:
                used_by.append({"filename": filename, "appflowid": str(entry.get("appflowid", "") or "")})
                continue
            if str(bp or "") == ref_name:
                used_by.append({"filename": filename, "appflowid": str(entry.get("appflowid", "") or "")})
        return used_by
