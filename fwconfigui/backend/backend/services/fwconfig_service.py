"""Service for fwconfig YAML CRUD operations."""

import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import AlreadyExistsError, ResourceInUseError, ValidationError
from backend.repositories.fwconfig_repository import FwConfigRepository

logger = logging.getLogger("uvicorn.error")


class FwConfigService:
    """Business logic for fwconfig YAML entities."""

    def __init__(self, product: Optional[str] = None):
        self.repo = FwConfigRepository(product)

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

    def _normalize_prev_key(self, yaml_type: str, original_name: Optional[str]) -> str:
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
        original_name: Optional[str],
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
        original_name: Optional[str] = None,
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
        original_name: Optional[str] = None,
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
        original_name: Optional[str] = None,
    ) -> None:
        payload = dict(data or {})
        if not str(payload.get("appflowid", "") or "").strip():
            raise ValidationError("data.appflowid", "is required")

        item_key = str(payload.get("appflowid", "") or "").strip().upper()
        item_key = re.sub(r"[^A-Z0-9_-]", "", item_key)
        payload["appflowid"] = item_key
        payload.pop("name", None)

        payload = self._normalize_fw_rule_payload(payload)
        self._validate_fw_rule_references(payload)

        self._enforce_uniqueness(
            yaml_type="fw-rules",
            filename=filename,
            item_key=item_key,
            original_name=original_name,
        )
        self.repo.upsert_item("fw-rules", filename=filename, name=item_key, entry=payload)

    def update_fw_rule_fields(
        self,
        *,
        appflowid: str,
        protocol_port_reference: Optional[List[str]] = None,
        business_purpose_reference: Optional[str] = None,
        keywords: Optional[List[str]] = None,
        envs: Optional[List[str]] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        key = str(appflowid or "").strip().upper()
        key = re.sub(r"[^A-Z0-9_-]", "", key)
        if not key:
            raise ValidationError("appflowid", "is required")

        found_filename: Optional[str] = None
        found_entry: Optional[Dict[str, Any]] = None
        for fn, entry in self.repo.read_items("fw-rules"):
            if not isinstance(entry, dict):
                continue
            if str(entry.get("appflowid", "") or "").strip().upper() == key:
                found_filename = fn
                found_entry = dict(entry)
                break

        if not found_filename or found_entry is None:
            from backend.exceptions.custom import NotFoundError

            raise NotFoundError("Item", key)

        if protocol_port_reference is not None:
            found_entry["protocol-port-reference"] = list(protocol_port_reference)
        if business_purpose_reference is not None:
            found_entry["business-purpose-reference"] = str(business_purpose_reference or "").strip()
        if keywords is not None:
            found_entry["keywords"] = list(keywords)
        if envs is not None:
            found_entry["envs"] = list(envs)

        found_entry["appflowid"] = key
        found_entry.pop("name", None)
        found_entry = self._normalize_fw_rule_payload(found_entry)
        self._validate_fw_rule_references(found_entry)

        self.repo.upsert_item("fw-rules", filename=found_filename, name=key, entry=found_entry)
        return (found_filename, found_entry)

    def move_fw_rule(self, *, appflowid: str, from_filename: str, to_filename: str) -> None:
        key = str(appflowid or "").strip().upper()
        key = re.sub(r"[^A-Z0-9_-]", "", key)
        if not key:
            raise ValidationError("appflowid", "is required")

        src = str(from_filename or "").strip()
        dst = str(to_filename or "").strip()
        if not src:
            raise ValidationError("from_filename", "is required")
        if not dst:
            raise ValidationError("to_filename", "is required")
        if src == dst:
            return

        found_in_src = False
        entry_to_move: Optional[Dict[str, Any]] = None
        for fn, entry in self.repo.read_items("fw-rules"):
            if fn != src:
                continue
            if not isinstance(entry, dict):
                continue
            if str(entry.get("appflowid", "") or "").strip().upper() == key:
                found_in_src = True
                entry_to_move = dict(entry)
                break

        if not found_in_src or entry_to_move is None:
            from backend.exceptions.custom import NotFoundError

            raise NotFoundError("Item", key)

        entry_to_move["appflowid"] = key
        entry_to_move.pop("name", None)
        entry_to_move = self._normalize_fw_rule_payload(entry_to_move)
        self._validate_fw_rule_references(entry_to_move)

        self.repo.upsert_item("fw-rules", filename=dst, name=key, entry=entry_to_move)
        self.repo.delete_item("fw-rules", filename=src, name=key)

    def _normalize_fw_rule_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        next_payload = dict(payload or {})

        def sort_name_list(v: Any) -> List[str]:
            items = v if isinstance(v, list) else []
            out = [str(x or "").strip() for x in items if str(x or "").strip()]
            return sorted(out, key=lambda s: s.lower())

        def normalize_endpoint_list(v: Any) -> List[Dict[str, Any]]:
            lst = v if isinstance(v, list) else []
            out: List[Dict[str, Any]] = []
            for it in lst:
                if not isinstance(it, dict):
                    continue
                group = str(it.get("group", "") or "").strip()
                envs = sort_name_list(it.get("envs"))
                out.append({"group": group, "envs": envs})
            return sorted(out, key=lambda d: str(d.get("group", "") or "").lower())

        if "protocol-port-reference" in next_payload:
            next_payload["protocol-port-reference"] = sort_name_list(next_payload.get("protocol-port-reference"))

        if "keywords" in next_payload:
            next_payload["keywords"] = sort_name_list(next_payload.get("keywords"))

        if "envs" in next_payload:
            next_payload["envs"] = sort_name_list(next_payload.get("envs"))

        if "source-list" in next_payload:
            next_payload["source-list"] = normalize_endpoint_list(next_payload.get("source-list"))
        if "destination-list" in next_payload:
            next_payload["destination-list"] = normalize_endpoint_list(next_payload.get("destination-list"))

        return next_payload

    def _validate_fw_rule_references(self, payload: Dict[str, Any]) -> None:
        next_payload = dict(payload or {})

        pp_names = {str(x.get("name", "") or "").strip().lower() for x in self.list_items("port-protocol")}
        bp_names = {str(x.get("name", "") or "").strip().lower() for x in self.list_items("business-purpose")}
        env_names = {str(x.get("name", "") or "").strip().lower() for x in self.list_items("env")}
        kw_names = {str(x.get("name", "") or "").strip().upper() for x in self.list_items("keywords")}

        refs = next_payload.get("protocol-port-reference")
        if isinstance(refs, list):
            for r in refs:
                n = str(r or "").strip().lower()
                if n and n not in pp_names:
                    raise ValidationError("protocol-port-reference", f"unknown port-protocol '{r}'")

        bp = str(next_payload.get("business-purpose-reference", "") or "").strip().lower()
        if bp and bp not in bp_names:
            raise ValidationError("business-purpose-reference", f"unknown business-purpose '{bp}'")

        kws = next_payload.get("keywords")
        if isinstance(kws, list):
            for k in kws:
                n = str(k or "").strip().upper()
                if n and n not in kw_names:
                    raise ValidationError("keywords", f"unknown keyword '{k}'")

        envs = next_payload.get("envs")
        if isinstance(envs, list):
            for e in envs:
                n = str(e or "").strip().lower()
                if n and n not in env_names:
                    raise ValidationError("envs", f"unknown env '{e}'")

    def validate_fw_rules_commit(self) -> List[str]:
        """Validate fw-rules across all files.

        This is used by the UI "Commit" action to validate the full rule-templates set.
        Returns a list of human-readable error messages.
        """

        errors: List[str] = []

        env_names = {str(x.get("name", "") or "").strip().lower() for x in self.list_items("env")}
        kw_names = {str(x.get("name", "") or "").strip().upper() for x in self.list_items("keywords")}
        bp_names = {str(x.get("name", "") or "").strip().lower() for x in self.list_items("business-purpose")}
        pp_names = {str(x.get("name", "") or "").strip().lower() for x in self.list_items("port-protocol")}

        all_entries: List[Dict[str, Any]] = []
        for filename, entry in self.repo.read_items("fw-rules"):
            if not isinstance(entry, dict):
                continue
            all_entries.append({"filename": filename, "entry": dict(entry)})

        seen: Dict[str, int] = {}
        for it in all_entries:
            appflowid = str(it["entry"].get("appflowid", "") or "").strip().upper()
            if not appflowid:
                continue
            seen[appflowid] = seen.get(appflowid, 0) + 1

        for appflowid, count in seen.items():
            if count > 1:
                errors.append(f"Duplicate appflowid '{appflowid}'")

        def _fmt_context(fn: str, app: str) -> str:
            a = str(app or "").strip().upper() or "(missing appflowid)"
            return f"[{fn}] {a}"

        for it in all_entries:
            fn = str(it.get("filename", "") or "").strip()
            payload = dict(it.get("entry") or {})
            app = str(payload.get("appflowid", "") or "").strip().upper()
            ctx = _fmt_context(fn, app)

            if not app:
                errors.append(f"{ctx}: appflowid is required")
                continue

            envs = payload.get("envs")
            if not isinstance(envs, list) or len([x for x in envs if str(x or "").strip()]) == 0:
                errors.append(f"{ctx}: envs must not be empty")
                continue

            rule_envs = {str(x or "").strip().lower() for x in envs if str(x or "").strip()}

            src = payload.get("source-list")
            if not isinstance(src, list) or len(src) == 0:
                errors.append(f"{ctx}: source-list must not be empty")
            for idx, ep in enumerate(src):
                if not isinstance(ep, dict):
                    continue
                group = str(ep.get("group", "") or "").strip()
                if not group:
                    errors.append(f"{ctx}: source-list[{idx}].group must not be empty")
                ep_envs = ep.get("envs")
                if isinstance(ep_envs, list):
                    ep_env_set = {str(e or "").strip().lower() for e in ep_envs if str(e or "").strip()}
                    if not ep_env_set.issubset(rule_envs):
                        extra = ep_env_set - rule_envs
                        errors.append(f"{ctx}: source-list[{idx}].envs contains {extra} not in rule envs")

            dst = payload.get("destination-list")
            if not isinstance(dst, list) or len(dst) == 0:
                errors.append(f"{ctx}: destination-list must not be empty")
            for idx, ep in enumerate(dst if isinstance(dst, list) else []):
                if not isinstance(ep, dict):
                    continue
                group = str(ep.get("group", "") or "").strip()
                if not group:
                    errors.append(f"{ctx}: destination-list[{idx}].group must not be empty")
                ep_envs = ep.get("envs")
                if isinstance(ep_envs, list):
                    ep_env_set = {str(e or "").strip().lower() for e in ep_envs if str(e or "").strip()}
                    if not ep_env_set.issubset(rule_envs):
                        extra = ep_env_set - rule_envs
                        errors.append(f"{ctx}: destination-list[{idx}].envs contains {extra} not in rule envs")

            refs = payload.get("protocol-port-reference")
            if not isinstance(refs, list) or len([x for x in refs if str(x or "").strip()]) == 0:
                errors.append(f"{ctx}: protocol-port-reference must not be empty")

            bp = str(payload.get("business-purpose-reference", "") or "").strip().lower()
            if not bp:
                errors.append(f"{ctx}: business-purpose-reference must not be empty")

            def _validate_endpoint_envs(lst: Any, field: str) -> None:
                if not isinstance(lst, list):
                    return
                for idx, ep in enumerate(lst):
                    if not isinstance(ep, dict):
                        continue
                    ep_envs = ep.get("envs")
                    if not isinstance(ep_envs, list):
                        continue
                    for e in ep_envs:
                        ev = str(e or "").strip().lower()
                        if not ev:
                            continue
                        if ev not in rule_envs:
                            errors.append(
                                f"{ctx}: {field}[{idx}].envs contains '{e}' not in rule envs"
                            )

            _validate_endpoint_envs(src, "source-list")
            _validate_endpoint_envs(dst, "destination-list")

            # Validate against reference tables.
            # (Reuse existing logic for env/keyword/bp/pp existence.)
            try:
                self._validate_fw_rule_references(payload)
            except ValidationError as ve:
                errors.append(f"{ctx}: {ve.field} {ve.message}")

            # Additional explicit membership checks (required fields).
            if bp and bp not in bp_names:
                errors.append(f"{ctx}: business-purpose-reference unknown '{bp}'")

            if isinstance(refs, list):
                for r in refs:
                    n = str(r or "").strip().lower()
                    if n and n not in pp_names:
                        errors.append(f"{ctx}: protocol-port-reference unknown '{r}'")

            kws = payload.get("keywords")
            if isinstance(kws, list):
                for k in kws:
                    n = str(k or "").strip().upper()
                    if n and n not in kw_names:
                        errors.append(f"{ctx}: keyword unknown '{k}'")

            for e in rule_envs:
                if e and e not in env_names:
                    errors.append(f"{ctx}: env unknown '{e}'")

        return errors

    def save_env(
        self,
        *,
        filename: str,
        name: str,
        data: Dict[str, Any],
        original_name: Optional[str] = None,
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
        original_name: Optional[str] = None,
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
