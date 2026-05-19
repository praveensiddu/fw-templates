from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from backend.exceptions.custom import AlreadyExistsError, ValidationError
from backend.utils.workspace import get_fwconfigfiles_root
from backend.utils.yaml_utils import list_yaml_files, read_yaml_dict, write_yaml_dict


class GroupsService:
    _DEFAULT_FILENAME = "groups.yaml"

    def __init__(self, product: Optional[str] = None):
        self._product = product

    @staticmethod
    def _normalize_env(env: str) -> str:
        v = str(env or "").strip().lower()
        if not v:
            raise ValidationError("env", "is required")
        return v

    @staticmethod
    def _normalize_name(name: str) -> str:
        v = str(name or "").strip().lower()
        v = "".join([c for c in v if c.isalnum() or c in {"_", "-"}])
        if not v:
            raise ValidationError("name", "is required")
        return v

    @staticmethod
    def _normalize_filename(filename: Optional[str]) -> str:
        v = str(filename or "").strip()
        return v or GroupsService._DEFAULT_FILENAME

    def _env_groups_dir(self, env: str) -> Path:
        e = self._normalize_env(env)
        root = get_fwconfigfiles_root(self._product) / e / "groups"
        root.mkdir(parents=True, exist_ok=True)
        return root

    @staticmethod
    def _validate_group_fields(data: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(data or {})
        members = payload.get("members")
        if not isinstance(members, list):
            raise ValidationError("data.members", "must be a list")
        cleaned_members = [str(x or "").strip() for x in members]
        cleaned_members = [m for m in cleaned_members if m]
        if not cleaned_members:
            raise ValidationError("data.members", "must have at least one item")
        cleaned_members = sorted(cleaned_members, key=lambda s: s.lower())

        out: Dict[str, Any] = {"members": cleaned_members}

        name_override = payload.get("name-override")
        if name_override is not None:
            no = str(name_override or "").strip()
            if no:
                out["name-override"] = no

        return out

    def _read_groups_file(self, path: Path) -> Dict[str, Any]:
        raw = read_yaml_dict(path)
        if not isinstance(raw, dict):
            raw = {}
        groups = raw.get("groups")
        if not isinstance(groups, dict):
            groups = {}
        return {"groups": dict(groups)}

    def _write_groups_file(self, path: Path, groups: Dict[str, Any]) -> None:
        write_yaml_dict(path, {"groups": groups}, sort_keys=True)

    def _validate_env_exists(self, env: str) -> None:
        e = self._normalize_env(env)
        env_path = get_fwconfigfiles_root(None) / "env.yaml"
        raw = read_yaml_dict(env_path)
        if not isinstance(raw, dict) or not raw:
            return
        valid = {str(k or "").strip().lower() for k in raw.keys() if str(k or "").strip()}
        if valid and e not in valid:
            raise ValidationError("env", f"groups validation unknown env '{e}'")

    def list_items(self, *, env: str) -> List[Dict[str, Any]]:
        self._validate_env_exists(env)
        items: List[Dict[str, Any]] = []
        root = self._env_groups_dir(env)
        for p in list_yaml_files(root):
            raw = self._read_groups_file(p)
            groups = raw.get("groups", {})
            if not isinstance(groups, dict):
                continue

            for k in sorted([str(x) for x in groups.keys()], key=lambda s: s.lower()):
                name = str(k or "").strip()
                if not name:
                    continue
                v = groups.get(k)
                data = dict(v) if isinstance(v, dict) else {}
                items.append({"filename": p.name, "name": name, "data": data})
        return items

    def _find_existing(self, *, env: str, name: str) -> Optional[Tuple[str, str]]:
        root = self._env_groups_dir(env)
        key = self._normalize_name(name)
        for p in list_yaml_files(root):
            raw = self._read_groups_file(p)
            groups = raw.get("groups", {})
            if not isinstance(groups, dict):
                continue
            if key in {str(k or "").strip().lower() for k in groups.keys()}:
                return (p.name, key)
        return None

    def _remove_key_from_all_files(self, *, env: str, key: str) -> None:
        root = self._env_groups_dir(env)
        for p in list_yaml_files(root):
            raw = self._read_groups_file(p)
            groups = raw.get("groups", {})
            if not isinstance(groups, dict):
                groups = {}
            if key in {str(k or "").strip().lower() for k in groups.keys()}:
                groups.pop(key, None)
                self._write_groups_file(p, groups)

    def save_item(
        self,
        *,
        env: str,
        filename: Optional[str],
        name: str,
        data: Dict[str, Any],
        original_name: Optional[str] = None,
    ) -> None:
        self._validate_env_exists(env)
        file_name = self._normalize_filename(filename)
        key = self._normalize_name(name)
        prev = self._normalize_name(original_name) if str(original_name or "").strip() else ""

        entry = self._validate_group_fields(data)

        existing = self._find_existing(env=env, name=key)
        if existing:
            (existing_file, existing_key) = existing
            if existing_key == key and (not prev or prev != key):
                raise AlreadyExistsError("name", f"'{key}' already exists in {existing_file}")

        if prev and prev != key:
            self._remove_key_from_all_files(env=env, key=prev)

        root = self._env_groups_dir(env)
        path = root / file_name
        raw = self._read_groups_file(path)
        groups = raw.get("groups", {})
        if not isinstance(groups, dict):
            groups = {}

        if prev and prev != key:
            groups.pop(prev, None)

        groups[key] = entry
        self._write_groups_file(path, groups)

    def delete_item(self, *, env: str, filename: Optional[str], name: str) -> None:
        self._validate_env_exists(env)
        file_name = self._normalize_filename(filename)
        key = self._normalize_name(name)

        root = self._env_groups_dir(env)
        path = root / file_name
        raw = self._read_groups_file(path)
        groups = raw.get("groups", {})
        if not isinstance(groups, dict):
            groups = {}

        groups.pop(key, None)
        self._write_groups_file(path, groups)
