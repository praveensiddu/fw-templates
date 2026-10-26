function GroupsTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [memberOptions, setMemberOptions] = React.useState([]);
  const [componentItems, setComponentItems] = React.useState([]);
  const [groupNameCandidates, setGroupNameCandidates] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [usedInGrpModal, setUsedInGrpModal] = React.useState({ isOpen: false, name: "", items: [], loading: false, error: "" });
  const [usedInRuleModal, setUsedInRuleModal] = React.useState({ isOpen: false, name: "", items: [], loading: false, error: "" });
  const [draft, setDraft] = React.useState({ filename: "groups.yaml", name: "", members: [], memberFilter: "" });
  const [originalRef, setOriginalRef] = React.useState({ filename: "groups.yaml", name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });
  const [hasAddrs, setHasAddrs] = React.useState(false);
  const [addrsEmptyPopup, setAddrsEmptyPopup] = React.useState(false);
  const [noGroupsPopup, setNoGroupsPopup] = React.useState(false);
  const [noComponentsPopup, setNoComponentsPopup] = React.useState(false);
  const [isCheckingUsed, setIsCheckingUsed] = React.useState(false);
  const [isOnboarding, setIsOnboarding] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [groupsResp, addrsResp, compResp, groupOpts] = await Promise.all([
        listGroups(env),
        listAddrs(env),
        listFwConfigItems("components"),
        listGroupNameOptions(env),
      ]);
      setItems(groupsResp?.items || []);
      setComponentItems(compResp?.items || []);
      setGroupNameCandidates(Array.isArray(groupOpts) ? groupOpts : []);
      setHasAddrs((addrsResp?.items || []).length > 0);

      const opts = (addrsResp?.items || [])
        .map((it) => safeTrim(it?.name))
        .filter(Boolean)
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      setMemberOptions(opts);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, setLoading, setError]);

  const groupNameOptions = React.useMemo(() => {
    const existing = new Set((items || []).map((it) => safeTrim(it?.name).toLowerCase()).filter(Boolean));
    const keep = editingKey && editingKey !== "__new__" ? safeTrim(originalRef.name).toLowerCase() : "";
    return (groupNameCandidates || []).filter((v) => {
      const lc = v.toLowerCase();
      return !existing.has(lc) || lc === keep;
    });
  }, [groupNameCandidates, items, editingKey, originalRef.name]);

  React.useEffect(() => {
    setEditingKey("");
    setDraft({ filename: "groups.yaml", name: "", members: [], memberFilter: "" });
    setOriginalRef({ filename: "groups.yaml", name: "" });
    setConfirmDelete({ show: false, row: null });
    setUsedInGrpModal({ isOpen: false, name: "", items: [], loading: false, error: "" });
    setUsedInRuleModal({ isOpen: false, name: "", items: [], loading: false, error: "" });
    load();
  }, [env, load]);

  const onCheckUsed = React.useCallback(async () => {
    if (isCheckingUsed) return;
    try {
      setIsCheckingUsed(true);
      setLoading(true);
      setError("");
      await checkGroupUsedInGroups(env);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setIsCheckingUsed(false);
    }
  }, [env, isCheckingUsed, load, setLoading, setError]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({ ...it }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", filename: "", members: "", inFirewall: "", usedInGrp: "", usedInRule: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row.name),
      filename: safeTrim(row.filename),
      members: Array.isArray(row?.data?.members) ? row.data.members.map((m) => safeTrim(m)).filter(Boolean).join("\n") : "",
      inFirewall: (() => {
        const v = row?.data?.["in-firewall"];
        if (v === true) return "true";
        if (v === false) return "false";
        const s = safeTrim(v).toLowerCase();
        return s || "empty";
      })(),
      usedInGrp: (() => {
        const v = row?.data?.["used-in-grp"];
        if (v === null || v === undefined) return "empty";
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return "empty";
        return String(n);
      })(),
      usedInRule: (() => {
        const v = row?.data?.["used-in-rule"];
        if (v === true) return "true";
        if (v === false) return "false";
        const s = safeTrim(v).toLowerCase();
        return s || "empty";
      })(),
    }),
    sortBy: (a, b) => safeTrim(a?.name).localeCompare(safeTrim(b?.name)),
  });

  const onAdd = React.useCallback(() => {
    if (!hasAddrs) {
      setAddrsEmptyPopup(true);
      return;
    }
    if (!Array.isArray(componentItems) || componentItems.length === 0) {
      setNoComponentsPopup(true);
      return;
    }
    if (groupNameCandidates.length > 0 && groupNameOptions.length === 0) {
      setNoGroupsPopup(true);
      return;
    }
    setDraft({ filename: "groups.yaml", name: "", members: [], memberFilter: "" });
    setOriginalRef({ filename: "groups.yaml", name: "" });
    setEditingKey("__new__");
  }, [hasAddrs, componentItems, groupNameCandidates, groupNameOptions]);

  const onEdit = React.useCallback((row) => {
    const n = safeTrim(row.name);
    const fn = safeTrim(row.filename) || "groups.yaml";
    const members = Array.isArray(row?.data?.members) ? row.data.members : [];
    const cleanedMembers = (members || []).map((m) => safeTrim(m)).filter(Boolean);
    setDraft({ filename: fn, name: n, members: cleanedMembers, memberFilter: "" });
    setOriginalRef({ filename: fn, name: n });
    setEditingKey(`${fn}::${n}`);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    const ms = Array.isArray(draft.members) ? draft.members.map((m) => safeTrim(m)).filter(Boolean) : [];
    return isNonEmptyString(draft.name) && ms.length > 0;
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ filename: "groups.yaml", name: "", members: [], memberFilter: "" });
    setOriginalRef({ filename: "groups.yaml", name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name);

      const filename = safeTrim(draft.filename) || "groups.yaml";
      const members = (Array.isArray(draft.members) ? draft.members : [])
        .map((m) => safeTrim(m))
        .filter(Boolean);

      const prevName = safeTrim(originalRef.name);
      const existing = prevName
        ? (items || []).find(
            (it) => safeTrim(it?.name) === prevName && (safeTrim(it?.filename) || "groups.yaml") === filename
          )
        : null;
      const nameOverride = Array.isArray(existing?.data?.["name-override"])
        ? existing.data["name-override"].map((x) => safeTrim(x)).filter(Boolean)
        : [];

      await saveGroup(env, {
        filename,
        name: nextName,
        original_name: prevName || undefined,
        data: {
          members,
          ...(nameOverride.length > 0 ? { "name-override": nameOverride } : {}),
        },
      });

      onCancelEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, draft, originalRef, items, setLoading, setError, load, onCancelEdit]);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteGroup(env, row?.name, row?.filename);
      setConfirmDelete({ show: false, row: null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, confirmDelete, setLoading, setError, load]);

  const onExclude = React.useCallback(
    async (row) => {
      const n = safeTrim(row?.name);
      const fn = safeTrim(row?.filename) || "groups.yaml";
      try {
        setLoading(true);
        setError("");
        await excludeGroupFromImport(env, n);
        setItems((prev) =>
          (Array.isArray(prev) ? prev : []).filter((it) => {
            const itName = safeTrim(it?.name);
            const itFn = safeTrim(it?.filename) || "groups.yaml";
            return !(itName === n && itFn === fn);
          })
        );
        await deleteGroup(env, n, fn);
      } catch (e) {
        setError(formatError(e));
        await load();
      } finally {
        setLoading(false);
      }
    },
    [env, setLoading, setError, load]
  );

  const onOnboard = React.useCallback(
    async (row) => {
      if (isOnboarding) return;
      const n = safeTrim(row?.name);
      const fn = safeTrim(row?.filename) || "groups.yaml";
      if (!n) return;
      try {
        setIsOnboarding(true);
        setLoading(true);
        setError("");
        await onboardGroupFromFmExtract(env, n);
        setItems((prev) =>
          (Array.isArray(prev) ? prev : []).filter((it) => {
            const itName = safeTrim(it?.name);
            const itFn = safeTrim(it?.filename) || "groups.yaml";
            return !(itName === n && itFn === fn);
          })
        );
        await load();
      } catch (e) {
        setError(formatError(e));
        await load();
      } finally {
        setLoading(false);
        setIsOnboarding(false);
      }
    },
    [env, isOnboarding, load, setLoading, setError]
  );

  const onShowUsedInGroups = React.useCallback(
    async (row) => {
      const name = safeTrim(row?.name);
      if (!name) return;
      try {
        setUsedInGrpModal({ isOpen: true, name, items: [], loading: true, error: "" });
        const resp = await getGroupUsedInGroups(env, name);
        const list = Array.isArray(resp?.items) ? resp.items : [];
        setUsedInGrpModal({ isOpen: true, name, items: list, loading: false, error: "" });
      } catch (e) {
        setUsedInGrpModal({ isOpen: true, name, items: [], loading: false, error: formatError(e) });
      }
    },
    [env]
  );

  const onShowUsedInRules = React.useCallback(
    async (row) => {
      const name = safeTrim(row?.name);
      if (!name) return;
      try {
        setUsedInRuleModal({ isOpen: true, name, items: [], loading: true, error: "" });
        const resp = await getGroupUsedInRules(env, name);
        const list = Array.isArray(resp?.items) ? resp.items : [];
        setUsedInRuleModal({ isOpen: true, name, items: list, loading: false, error: "" });
      } catch (e) {
        setUsedInRuleModal({ isOpen: true, name, items: [], loading: false, error: formatError(e) });
      }
    },
    [env]
  );

  const onExcludeEnvCommon = React.useCallback(
    async (row) => {
      const n = safeTrim(row?.name);
      const fn = safeTrim(row?.filename) || "groups.yaml";
      try {
        setLoading(true);
        setError("");
        await excludeGroupFromEnvCommon(env, n);
        setItems((prev) =>
          (Array.isArray(prev) ? prev : []).filter((it) => {
            const itName = safeTrim(it?.name);
            const itFn = safeTrim(it?.filename) || "groups.yaml";
            return !(itName === n && itFn === fn);
          })
        );
        await deleteGroup(env, n, fn);
      } catch (e) {
        setError(formatError(e));
        await load();
      } finally {
        setLoading(false);
      }
    },
    [env, setLoading, setError, load]
  );

  return (
    <>
      <GroupsTableView
        env={env}
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onCheckUsed={onCheckUsed}
        isCheckingUsed={isCheckingUsed}
        onShowUsedInGroups={onShowUsedInGroups}
        onShowUsedInRules={onShowUsedInRules}
        usedInGrpModal={usedInGrpModal}
        setUsedInGrpModal={setUsedInGrpModal}
        usedInRuleModal={usedInRuleModal}
        setUsedInRuleModal={setUsedInRuleModal}
        onEdit={onEdit}
        onDelete={onDelete}
        onOnboard={onOnboard}
        isOnboarding={isOnboarding}
        onExclude={onExclude}
        onExcludeEnvCommon={onExcludeEnvCommon}
        editingKey={editingKey}
        draft={draft}
        setDraft={setDraft}
        groupNameOptions={groupNameOptions}
        groupNameCandidates={groupNameCandidates}
        memberOptions={memberOptions}
        canSubmit={canSubmit}
        onCancelEdit={onCancelEdit}
        onSave={onSave}
      />

      <ConfirmationModal
        show={confirmDelete.show}
        title="Delete item"
        message={confirmDelete.row ? `Delete '${confirmDelete.row.name}' from '${safeTrim(confirmDelete.row.filename) || "groups.yaml"}'?` : ""}
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />

      <ConfirmationModal
        show={addrsEmptyPopup}
        title="Cannot add group"
        message="Addrs table is empty. Group members are names from Addrs table. Create address objects before creating groups"
        onClose={() => setAddrsEmptyPopup(false)}
        onConfirm={() => setAddrsEmptyPopup(false)}
        confirmText="OK"
      />

      <ConfirmationModal
        show={noComponentsPopup}
        title="Cannot add group"
        message="Group names are generated from components and their sites. The components table is empty - create components before creating groups."
        onClose={() => setNoComponentsPopup(false)}
        onConfirm={() => setNoComponentsPopup(false)}
        confirmText="OK"
      />

      <ConfirmationModal
        show={noGroupsPopup}
        title="Cannot add group"
        message="All allowed groups based on your components table are already part of this groups table. There are no more groups remaining to be added."
        onClose={() => setNoGroupsPopup(false)}
        onConfirm={() => setNoGroupsPopup(false)}
        confirmText="OK"
      />
    </>
  );
}
