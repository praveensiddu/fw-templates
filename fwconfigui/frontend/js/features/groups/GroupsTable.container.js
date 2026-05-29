function GroupsTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [memberOptions, setMemberOptions] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ filename: "groups.yaml", name: "", members: [], nameOverride: "", inFirewall: "" });
  const [originalRef, setOriginalRef] = React.useState({ filename: "groups.yaml", name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [groupsResp, addrsResp] = await Promise.all([listGroups(env), listAddrs(env)]);
      setItems(groupsResp?.items || []);

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

  React.useEffect(() => {
    setEditingKey("");
    setDraft({ filename: "groups.yaml", name: "", members: [], nameOverride: "", inFirewall: "" });
    setOriginalRef({ filename: "groups.yaml", name: "" });
    setConfirmDelete({ show: false, row: null });
    load();
  }, [env, load]);

  const onCheckUsed = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await checkGroupUsedInGroups(env);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, load, setLoading, setError]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({ ...it }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", filename: "", members: "", nameOverride: "", inFirewall: "", usedInGrp: "", usedInRule: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row.name),
      filename: safeTrim(row.filename),
      members: Array.isArray(row?.data?.members) ? row.data.members.map((m) => safeTrim(m)).filter(Boolean).join("\n") : "",
      nameOverride: safeTrim(row?.data?.["name-override"]) || "empty",
      inFirewall: (() => {
        const v = row?.data?.["in-firewall"];
        if (v === true) return "true";
        if (v === false) return "false";
        const s = safeTrim(v).toLowerCase();
        return s || "empty";
      })(),
      usedInGrp: (() => {
        const v = row?.data?.["used-in-grp"];
        if (v === true) return "true";
        if (v === false) return "false";
        const s = safeTrim(v).toLowerCase();
        return s || "empty";
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
    setDraft({ filename: "groups.yaml", name: "", members: [], nameOverride: "", inFirewall: "" });
    setOriginalRef({ filename: "groups.yaml", name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const n = safeTrim(row.name);
    const fn = safeTrim(row.filename) || "groups.yaml";
    const members = Array.isArray(row?.data?.members) ? row.data.members : [];
    const cleanedMembers = (members || []).map((m) => safeTrim(m)).filter(Boolean);
    const no = safeTrim(row?.data?.["name-override"]);
    const rawInFirewall = row?.data?.["in-firewall"];
    const inFirewall = rawInFirewall === true ? "true" : rawInFirewall === false ? "false" : safeTrim(rawInFirewall);
    setDraft({ filename: fn, name: n, members: cleanedMembers, nameOverride: no, inFirewall });
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
    setDraft({ filename: "groups.yaml", name: "", members: [], nameOverride: "", inFirewall: "" });
    setOriginalRef({ filename: "groups.yaml", name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");

      const filename = safeTrim(draft.filename) || "groups.yaml";
      const members = (Array.isArray(draft.members) ? draft.members : [])
        .map((m) => safeTrim(m))
        .filter(Boolean);
      const nameOverride = safeTrim(draft.nameOverride);
      const inFirewallRaw = safeTrim(draft.inFirewall).toLowerCase();
      const inFirewall = inFirewallRaw === "true" ? true : inFirewallRaw === "false" ? false : "";

      await saveGroup(env, {
        filename,
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data: {
          members,
          ...(isNonEmptyString(nameOverride) ? { "name-override": nameOverride } : {}),
          ...(inFirewallRaw === "true" || inFirewallRaw === "false" ? { "in-firewall": inFirewall } : {}),
        },
      });

      onCancelEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, draft, originalRef, setLoading, setError, load, onCancelEdit]);

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
      try {
        setLoading(true);
        setError("");
        await excludeGroupFromImport(env, row?.name);
        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [env, setLoading, setError, load]
  );

  const onExcludeEnvCommon = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");
        await excludeGroupFromEnvCommon(env, row?.name);
        await load();
      } catch (e) {
        setError(formatError(e));
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
        onEdit={onEdit}
        onDelete={onDelete}
        onExclude={onExclude}
        onExcludeEnvCommon={onExcludeEnvCommon}
        editingKey={editingKey}
        draft={draft}
        setDraft={setDraft}
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
    </>
  );
}
