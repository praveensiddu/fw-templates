function AddrsTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({
    filename: "addresses.yaml",
    name: "",
    value: "",
    nameOverride: "",
    inFirewall: "",
  });
  const [originalRef, setOriginalRef] = React.useState({ filename: "addresses.yaml", name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await listAddrs(env);
      setItems(resp?.items || []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, setLoading, setError]);

  React.useEffect(() => {
    setEditingKey("");
    setDraft({ filename: "addresses.yaml", name: "", value: "", nameOverride: "", inFirewall: "" });
    setOriginalRef({ filename: "addresses.yaml", name: "" });
    setConfirmDelete({ show: false, row: null });
    load();
  }, [env, load]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({ ...it }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { filename: "", name: "", value: "", nameOverride: "", inFirewall: "" },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
      value: safeTrim(row?.data?.ip) || safeTrim(row?.data?.range) || safeTrim(row?.data?.subnet),
      nameOverride: safeTrim(row?.data?.["name-override"]) || "empty",
      inFirewall: (() => {
        const v = row?.data?.["in-firewall"];
        if (v === true) return "true";
        if (v === false) return "false";
        const s = safeTrim(v).toLowerCase();
        return s || "empty";
      })(),
    }),
    sortBy: (a, b) => {
      const af = safeTrim(a?.filename).toLowerCase();
      const bf = safeTrim(b?.filename).toLowerCase();
      if (af !== bf) return af.localeCompare(bf);
      return safeTrim(a?.name).localeCompare(safeTrim(b?.name));
    },
  });

  const onAdd = React.useCallback(() => {
    setDraft({ filename: "addresses.yaml", name: "", value: "", nameOverride: "", inFirewall: "" });
    setOriginalRef({ filename: "addresses.yaml", name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const n = safeTrim(row.name);
    const fn = safeTrim(row.filename) || "addresses.yaml";
    const data = row?.data && typeof row.data === "object" ? row.data : {};
    const value = safeTrim(data.ip) || safeTrim(data.range) || safeTrim(data.subnet);
    const rawInFirewall = data["in-firewall"];
    const inFirewall = rawInFirewall === true ? "true" : rawInFirewall === false ? "false" : safeTrim(rawInFirewall);
    setDraft({
      filename: fn,
      name: n,
      value,
      nameOverride: safeTrim(data["name-override"]),
      inFirewall,
    });
    setOriginalRef({ filename: fn, name: n });
    setEditingKey(`${fn}::${n}`);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    const hasName = isNonEmptyString(draft.name);
    const hasValue = isNonEmptyString(draft.value);
    return hasName && hasValue;
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ filename: "addresses.yaml", name: "", value: "", nameOverride: "", inFirewall: "" });
    setOriginalRef({ filename: "addresses.yaml", name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");

      const nextFilename = safeTrim(draft.filename) || "addresses.yaml";

      const rawValue = safeTrim(draft.value);
      const inferred = (() => {
        if (rawValue.includes("-")) return { range: rawValue };
        if (rawValue.includes("/")) return { subnet: rawValue };
        return { ip: rawValue };
      })();

      const data = {
        ...inferred,
        ...(isNonEmptyString(safeTrim(draft.nameOverride)) ? { "name-override": safeTrim(draft.nameOverride) } : {}),
      };

      const inFirewallRaw = safeTrim(draft.inFirewall).toLowerCase();
      if (inFirewallRaw === "true") data["in-firewall"] = true;
      if (inFirewallRaw === "false") data["in-firewall"] = false;

      await saveAddr(env, {
        filename: nextFilename,
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data,
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
      await deleteAddr(env, row?.name, row?.filename);
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
        await excludeAddrFromImport(env, row?.name);
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
      <AddrsTableView
        env={env}
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        onExclude={onExclude}
        editingKey={editingKey}
        draft={draft}
        setDraft={setDraft}
        canSubmit={canSubmit}
        onCancelEdit={onCancelEdit}
        onSave={onSave}
      />

      <ConfirmationModal
        show={confirmDelete.show}
        title="Delete item"
        message={
          confirmDelete.row
            ? `Delete '${confirmDelete.row.name}' from '${safeTrim(confirmDelete.row.filename) || "addresses.yaml"}'?`
            : ""
        }
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
