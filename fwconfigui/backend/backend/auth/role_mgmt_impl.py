from __future__ import annotations

import os
from pathlib import Path
from threading import RLock
from typing import Any, Dict, List

import yaml


def is_demo_mode() -> bool:
    return str(os.getenv("DEMO_MODE", os.getenv("IS_DEMO_MODE", "")) or "").strip().lower() in {
        "1",
        "true",
        "yes",
        "y",
        "on",
    }


class RoleMgmtImpl:
    _instance: "RoleMgmtImpl | None" = None
    _instance_lock = RLock()

    def __init__(self) -> None:
        self._lock = RLock()
        self._rbac_dir = Path.home() / "workspace" / "fwconfigfiles" / "control" / "rbac"
        self._demo_mode = is_demo_mode()
        self._legacy_store_path = self._rbac_dir / "role_assignments.yaml"
        self._store_paths: Dict[str, Path] = {}
        self._demo_users_path = self._rbac_dir / "demo_users.yaml"
        self._refresh_paths()
        self._data: Dict[str, Any] = {
            "group_product_roles": {},
            "user_product_roles": {},
            "group_global_roles": {},
            "user_global_roles": {},
            "user_groups": {},
        }
        # Always load from files - never create dummy data
        self._load()

    @classmethod
    def get_instance(cls) -> "RoleMgmtImpl":
        with cls._instance_lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def update_roles(self, *, force: bool = False) -> None:
        if force:
            self._refresh_paths()
            self._load()

    def _refresh_paths(self) -> None:
        demo_mode = is_demo_mode()

        workspace_raw = str(os.getenv("WORKSPACE", "")).strip()
        if workspace_raw:
            workspace = Path(workspace_raw).expanduser()
        else:
            workspace = Path.home() / "workspace"

        rbac_dir = workspace / "fwconfigfiles" / "control" / "rbac"
        if demo_mode:
            rbac_dir = rbac_dir / "demo_mode"

        with self._lock:
            self._demo_mode = demo_mode
            self._rbac_dir = rbac_dir
            self._legacy_store_path = self._rbac_dir / "role_assignments.yaml"
            self._store_paths = {
                "group_product_roles": self._rbac_dir / "group_product_roles.yaml",
                "user_product_roles": self._rbac_dir / "userid_product_roles.yaml",
                "group_global_roles": self._rbac_dir / "group_global_roles.yaml",
                "user_global_roles": self._rbac_dir / "user_global_roles.yaml",
                "user_groups": self._rbac_dir / "user_groups.yaml",
            }
            self._demo_users_path = self._rbac_dir / "demo_users.yaml"

    def _load(self) -> None:
        with self._lock:
            try:
                keys = ["group_product_roles", "user_product_roles", "group_global_roles", "user_global_roles", "user_groups"]
                loaded_any = False
                for key in keys:
                    p = self._store_paths.get(key)
                    if not p or not p.exists() or not p.is_file():
                        continue
                    raw = yaml.safe_load(p.read_text())
                    if isinstance(raw, dict):
                        self._data[key] = raw
                        loaded_any = True

                if loaded_any:
                    return

                if not self._legacy_store_path.exists() or not self._legacy_store_path.is_file():
                    return
                raw = yaml.safe_load(self._legacy_store_path.read_text())
                if not isinstance(raw, dict):
                    return

                for key in keys:
                    val = raw.get(key)
                    if isinstance(val, dict):
                        self._data[key] = val

                self._flush()
            except Exception:
                # Best effort: keep in-memory defaults
                return

    def _flush(self) -> None:
        with self._lock:
            self._rbac_dir.mkdir(parents=True, exist_ok=True)
            for key, path in self._store_paths.items():
                data = self._data.get(key)
                if not isinstance(data, dict):
                    data = {}
                path.write_text(yaml.safe_dump(data, sort_keys=False))


    def _norm(self, s: str | None) -> str:
        return str(s or "").strip()

    def get_grp2products2roles(self) -> dict:
        with self._lock:
            return dict(self._data.get("group_product_roles") or {})

    def get_user2products2roles(self) -> dict:
        with self._lock:
            return dict(self._data.get("user_product_roles") or {})

    def add_user2products2roles(self, grantor: str | None, user: str, product: str, role: str) -> None:
        user = self._norm(user)
        product = self._norm(product)
        role = self._norm(role)
        if not user or not product or not role:
            raise ValueError("user, product, and role are required")

        with self._lock:
            umap = self._data.setdefault("user_product_roles", {})
            amap = umap.setdefault(user, {})
            roles = amap.setdefault(product, [])
            if role not in roles:
                roles.append(role)
            self._flush()

    def del_user2products2roles(self, grantor: str | None, user: str, product: str, role: str) -> None:
        user = self._norm(user)
        product = self._norm(product)
        role = self._norm(role)
        if not user or not product or not role:
            raise ValueError("user, product, and role are required")

        with self._lock:
            umap = self._data.get("user_product_roles") or {}
            amap = (umap.get(user) or {})
            roles = (amap.get(product) or [])
            if role in roles:
                roles.remove(role)
            if not roles and product in amap:
                amap.pop(product, None)
            if not amap and user in umap:
                umap.pop(user, None)
            self._flush()

    def add_grp2products2roles(self, grantor: str | None, group: str, product: str, role: str) -> None:
        group = self._norm(group)
        product = self._norm(product)
        role = self._norm(role)
        if not group or not product or not role:
            raise ValueError("group, product, and role are required")

        with self._lock:
            gmap = self._data.setdefault("group_product_roles", {})
            amap = gmap.setdefault(group, {})
            roles = amap.setdefault(product, [])
            if role not in roles:
                roles.append(role)
            self._flush()

    def del_grp2products2roles(self, grantor: str | None, group: str, product: str, role: str) -> None:
        group = self._norm(group)
        product = self._norm(product)
        role = self._norm(role)
        if not group or not product or not role:
            raise ValueError("group, product, and role are required")

        with self._lock:
            gmap = self._data.get("group_product_roles") or {}
            amap = (gmap.get(group) or {})
            roles = (amap.get(product) or [])
            if role in roles:
                roles.remove(role)
            if not roles and product in amap:
                amap.pop(product, None)
            if not amap and group in gmap:
                gmap.pop(group, None)
            self._flush()

    def get_grps2globalroles(self) -> dict:
        with self._lock:
            return dict(self._data.get("group_global_roles") or {})

    def add_grps2globalroles(self, grantor: str | None, group: str, role: str) -> None:
        group = self._norm(group)
        role = self._norm(role)
        if not group or not role:
            raise ValueError("group and role are required")

        with self._lock:
            gmap = self._data.setdefault("group_global_roles", {})
            roles = gmap.setdefault(group, [])
            if role not in roles:
                roles.append(role)
            self._flush()

    def del_grps2globalroles(self, grantor: str | None, group: str, role: str) -> None:
        group = self._norm(group)
        role = self._norm(role)
        if not group or not role:
            raise ValueError("group and role are required")

        with self._lock:
            gmap = self._data.get("group_global_roles") or {}
            roles = (gmap.get(group) or [])
            if role in roles:
                roles.remove(role)
            if not roles and group in gmap:
                gmap.pop(group, None)
            self._flush()

    def get_users2globalroles(self) -> dict:
        with self._lock:
            return dict(self._data.get("user_global_roles") or {})

    def add_users2globalroles(self, grantor: str | None, user: str, role: str) -> None:
        user = self._norm(user)
        role = self._norm(role)
        if not user or not role:
            raise ValueError("user and role are required")

        with self._lock:
            umap = self._data.setdefault("user_global_roles", {})
            roles = umap.setdefault(user, [])
            if role not in roles:
                roles.append(role)
            self._flush()

    def del_users2globalroles(self, grantor: str | None, user: str, role: str) -> None:
        user = self._norm(user)
        role = self._norm(role)
        if not user or not role:
            raise ValueError("user and role are required")

        with self._lock:
            umap = self._data.get("user_global_roles") or {}
            roles = (umap.get(user) or [])
            if role in roles:
                roles.remove(role)
            if not roles and user in umap:
                umap.pop(user, None)
            self._flush()

    def get_user_groups(self, user_id: str) -> List[str]:
        user_id = self._norm(user_id)
        if not user_id:
            return []
        with self._lock:
            ug = self._data.get("user_groups") or {}
            groups = ug.get(user_id)
            if isinstance(groups, list):
                return [self._norm(g) for g in groups if self._norm(g)]
            return []

    def get_user_roles(self, user_id: str, groups: List[str]) -> List[str]:
        roles: List[str] = []
        user_id = self._norm(user_id)
        with self._lock:
            umap = self._data.get("user_global_roles") or {}
            uroles = umap.get(user_id)
            if isinstance(uroles, list):
                roles.extend([self._norm(r) for r in uroles if self._norm(r)])

            gmap = self._data.get("group_global_roles") or {}
            for g in groups or []:
                groles = gmap.get(g)
                if isinstance(groles, list):
                    roles.extend([self._norm(r) for r in groles if self._norm(r)])

        # de-dupe preserving order
        seen = set()
        out: List[str] = []
        for r in roles:
            if r not in seen:
                seen.add(r)
                out.append(r)
        return out

    def get_product_roles(self, groups: List[str], user_id: str | None = None) -> Dict[str, List[str]]:
        product_roles: Dict[str, List[str]] = {}
        with self._lock:
            if user_id:
                umap = self._data.get("user_product_roles") or {}
                uamap = umap.get(self._norm(user_id))
                if isinstance(uamap, dict):
                    for product, roles in uamap.items():
                        if not isinstance(roles, list):
                            continue
                        for r in roles:
                            rr = self._norm(r)
                            if not rr:
                                continue
                            product_roles.setdefault(str(product), [])
                            if rr not in product_roles[str(product)]:
                                product_roles[str(product)].append(rr)

            gmap = self._data.get("group_product_roles") or {}
            for g in groups or []:
                amap = gmap.get(g)
                if not isinstance(amap, dict):
                    continue
                for product, roles in amap.items():
                    if not isinstance(roles, list):
                        continue
                    for r in roles:
                        rr = self._norm(r)
                        if not rr:
                            continue
                        product_roles.setdefault(str(product), [])
                        if rr not in product_roles[str(product)]:
                            product_roles[str(product)].append(rr)
        return product_roles

    def get_product_managedby(self, product: str) -> List[str]:
        product = self._norm(product)
        if not product:
            return []

        users: List[str] = []
        groups: List[str] = []

        with self._lock:
            umap = self._data.get("user_product_roles") or {}
            if isinstance(umap, dict):
                for user_id, products_map in umap.items():
                    if not isinstance(products_map, dict):
                        continue
                    roles = products_map.get(product)
                    if not isinstance(roles, list):
                        continue
                    if "manager" in [self._norm(r) for r in roles]:
                        uid = self._norm(str(user_id))
                        if uid:
                            users.append(uid)

            gmap = self._data.get("group_product_roles") or {}
            if isinstance(gmap, dict):
                for group, products_map in gmap.items():
                    if not isinstance(products_map, dict):
                        continue
                    roles = products_map.get(product)
                    if not isinstance(roles, list):
                        continue
                    if "manager" in [self._norm(r) for r in roles]:
                        gg = self._norm(str(group))
                        if gg:
                            groups.append(gg)

        seen = set()
        out: List[str] = []
        for v in (users + groups):
            if v not in seen:
                seen.add(v)
                out.append(v)
        return out

    def list_all_users(self) -> List[str]:
        """List all known users from RBAC stores.

        This is used to power the Role Management UI.
        """
        users: List[str] = []

        with self._lock:
            # From explicit user->* maps
            ug = self._data.get("user_groups") or {}
            if isinstance(ug, dict):
                users.extend([self._norm(str(u)) for u in ug.keys() if self._norm(str(u))])

            uglob = self._data.get("user_global_roles") or {}
            if isinstance(uglob, dict):
                users.extend([self._norm(str(u)) for u in uglob.keys() if self._norm(str(u))])

            uprod = self._data.get("user_product_roles") or {}
            if isinstance(uprod, dict):
                users.extend([self._norm(str(u)) for u in uprod.keys() if self._norm(str(u))])

            # Also include demo users file if present
            try:
                if self._demo_users_path.exists() and self._demo_users_path.is_file():
                    raw = yaml.safe_load(self._demo_users_path.read_text())
                    if isinstance(raw, dict):
                        users.extend([self._norm(str(u)) for u in raw.keys() if self._norm(str(u))])
            except Exception:
                pass

        # de-dupe preserving order
        seen = set()
        out: List[str] = []
        for u in users:
            if u and u not in seen:
                seen.add(u)
                out.append(u)
        return out

    def get_user_roles_snapshot(self, user_id: str) -> Dict[str, Any]:
        """Return global + product role snapshot for a user."""
        uid = self._norm(user_id)
        groups = self.get_user_groups(uid)
        return {
            "userid": uid,
            "groups": groups,
            "global_roles": self.get_user_roles(uid, groups),
            "product_roles": self.get_product_roles(groups, uid),
        }
