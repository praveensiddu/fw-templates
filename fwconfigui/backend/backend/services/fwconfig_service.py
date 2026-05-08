"""Service for fwconfig YAML CRUD operations."""

import logging
import re
from typing import Any, Dict, List

from backend.exceptions.custom import AlreadyExistsError, ResourceInUseError, ValidationError
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

    def _normalize_prev_key(self, yaml_type: str, original_name: str | None) -> str:
        prev_key = str(original_name or "").strip()
        if not prev_key:
            return ""
        if yaml_type in {"fw-rules", "keywords"}:
            return prev_key.upper()
        return prev_key.lower()

    def _enforce_uniqueness(
        self,
        *,
        yaml_type: str,
        filename: str,
        item_key: str,
        original_name: str | None,
    ) -> None:
        if (original_name is None or not str(original_name or "").strip()) and self.repo.item_exists(
            yaml_type,
            filename=filename,
            name=item_key,
        ):
            raise AlreadyExistsError("Item", item_key)

        if original_name is not None:
            prev_key = self._normalize_prev_key(yaml_type, original_name)
            if prev_key and prev_key != item_key:
                if self.repo.item_exists(yaml_type, filename=filename, name=item_key):
                    raise AlreadyExistsError("Item", item_key)

    def save_port_protocol(
        self,
        *,
        filename: str,
        name: str,
        data: Dict[str, Any],
        original_name: str | None = None,
    ) -> None:
        payload = dict(data or {})
        payload["name"] = str(name or "").strip()

        pp = payload.get("port-protocol")
        if not isinstance(pp, dict):
            raise ValidationError("data.port-protocol", "must be an object")
        if not str(pp.get("port", "") or "").strip():
            raise ValidationError("data.port-protocol.port", "is required")
        if not str(pp.get("service", "") or "").strip():
            raise ValidationError("data.port-protocol.service", "is required")

        next_name = str(payload.get("name", "") or "").strip().lower()
        next_name = re.sub(r"[^a-z0-9_-]", "", next_name)
        if not next_name:
            raise ValidationError("name", "is required")
        payload["name"] = next_name

        self._enforce_uniqueness(
            yaml_type="port-protocol",
            filename=filename,
            item_key=next_name,
            original_name=original_name,
        )
        self.repo.upsert_item("port-protocol", filename=filename, name=next_name, entry=payload)

    def save_business_purpose(
        self,
        *,
        filename: str,
        name: str,
        data: Dict[str, Any],
        original_name: str | None = None,
    ) -> None:
        payload = dict(data or {})
        payload["name"] = str(name or "").strip()

        bp = payload.get("business-purpose")
        if not str(bp or "").strip():
            raise ValidationError("data.business-purpose", "is required")

        next_name = str(payload.get("name", "") or "").strip().lower()
        next_name = re.sub(r"[^a-z0-9_-]", "", next_name)
        if not next_name:
            raise ValidationError("name", "is required")
        payload["name"] = next_name

        self._enforce_uniqueness(
            yaml_type="business-purpose",
            filename=filename,
            item_key=next_name,
            original_name=original_name,
        )
        self.repo.upsert_item("business-purpose", filename=filename, name=next_name, entry=payload)

    def save_fw_rules(
        self,
        *,
        filename: str,
        name: str,
        data: Dict[str, Any],
        original_name: str | None = None,
    ) -> None:
        payload = dict(data or {})
        if not str(payload.get("appflowid", "") or "").strip():
            raise ValidationError("data.appflowid", "is required")

        if "business_purpose" in payload:
            raise ValidationError(
                "data.business_purpose",
                "is not supported; rename to 'business-purpose-reference'",
            )

        item_key = str(payload.get("appflowid", "") or "").strip().upper()
        item_key = re.sub(r"[^A-Z0-9_-]", "", item_key)
        payload["appflowid"] = item_key
        payload.pop("name", None)

        self._enforce_uniqueness(
            yaml_type="fw-rules",
            filename=filename,
            item_key=item_key,
            original_name=original_name,
        )
        self.repo.upsert_item("fw-rules", filename=filename, name=item_key, entry=payload)

    def save_env(
        self,
        *,
        filename: str,
        name: str,
        data: Dict[str, Any],
        original_name: str | None = None,
    ) -> None:
        payload = dict(data or {})
        payload["name"] = str(name or "").strip()

        next_name = str(payload.get("name", "") or "").strip().lower()
        next_name = re.sub(r"[^a-z0-9]", "", next_name)
        if not next_name:
            raise ValidationError("name", "is required")
        payload["name"] = next_name

        self._enforce_uniqueness(
            yaml_type="env",
            filename=filename,
            item_key=next_name,
            original_name=original_name,
        )
        self.repo.upsert_item("env", filename=filename, name=next_name, entry=payload)

    def save_keywords(
        self,
        *,
        filename: str,
        name: str,
        data: Dict[str, Any],
        original_name: str | None = None,
    ) -> None:
        payload = dict(data or {})
        payload["name"] = str(name or "").strip()

        next_name = str(payload.get("name", "") or "").strip().upper()
        next_name = re.sub(r"[^A-Z0-9]", "", next_name)
        if not next_name:
            raise ValidationError("name", "is required")
        payload["name"] = next_name

        self._enforce_uniqueness(
            yaml_type="keywords",
            filename=filename,
            item_key=next_name,
            original_name=original_name,
        )
        self.repo.upsert_item("keywords", filename=filename, name=next_name, entry=payload)

    def save_item(
        self,
        yaml_type: str,
        filename: str,
        name: str,
        data: Dict[str, Any],
        original_name: str | None = None,
    ) -> None:
        if yaml_type == "port-protocol":
            return self.save_port_protocol(
                filename=filename,
                name=name,
                data=data,
                original_name=original_name,
            )
        if yaml_type == "business-purpose":
            return self.save_business_purpose(
                filename=filename,
                name=name,
                data=data,
                original_name=original_name,
            )
        if yaml_type == "fw-rules":
            return self.save_fw_rules(
                filename=filename,
                name=name,
                data=data,
                original_name=original_name,
            )
        if yaml_type == "env":
            return self.save_env(
                filename=filename,
                name=name,
                data=data,
                original_name=original_name,
            )
        if yaml_type == "keywords":
            return self.save_keywords(
                filename=filename,
                name=name,
                data=data,
                original_name=original_name,
            )

        payload = dict(data or {})
        item_key = str(name or "").strip()
        payload["name"] = item_key
        self._enforce_uniqueness(
            yaml_type=yaml_type,
            filename=filename,
            item_key=item_key,
            original_name=original_name,
        )
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
