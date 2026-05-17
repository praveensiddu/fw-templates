function PortProtocolTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "", port: "", service: "" });
  const [originalRef, setOriginalRef] = React.useState({ name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await listFwConfigItems("port-protocol");
      setItems(resp?.items || []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  React.useEffect(() => {
    load();
  }, [load]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const pp = it?.data?.["port-protocol"] || {};
      return {
        ...it,
        port: safeTrim(pp?.port),
        service: safeTrim(pp?.service),
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", port: "", service: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row.name),
      port: safeTrim(row.port),
      service: safeTrim(row.service),
    }),
    sortBy: (a, b) => safeTrim(a?.name).localeCompare(safeTrim(b?.name)),
  });

  const onAdd = React.useCallback(() => {
    setDraft({ name: "", port: "", service: "" });
    setOriginalRef({ name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const n = safeTrim(row.name);
    setDraft({
      name: n,
      port: safeTrim(row?.data?.["port-protocol"]?.port),
      service: safeTrim(row?.data?.["port-protocol"]?.service),
    });
    setOriginalRef({ name: n });
    setEditingKey(n);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  function generateUniqueCopyName(existingNames, baseName) {
    const existing = new Set((existingNames || []).map((x) => String(x || "").trim()));
    const base = safeTrim(baseName);
    if (!base) return "";

    const candidate1 = `${base}_copy`;
    if (!existing.has(candidate1)) return candidate1;

    for (let i = 2; i <= 500; i++) {
      const c = `${base}_copy${i}`;
      if (!existing.has(c)) return c;
    }
    return `${base}_copy${Date.now()}`;
  }

  const onCopy = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");

        const allNames = (items || []).map((it) => safeTrim(it?.name)).filter(Boolean);
        const srcName = safeTrim(row?.name);
        const nextName = generateUniqueCopyName(allNames, srcName);
        if (!nextName) throw new Error("Unable to generate copy name");

        const data = row?.data || {};
        await saveFwConfigItem("port-protocol", {
          name: nextName,
          data: {
            name: nextName,
            "port-protocol": {
              port: safeTrim(data?.["port-protocol"]?.port),
              service: safeTrim(data?.["port-protocol"]?.service),
            },
          },
        });

        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [items, setLoading, setError, load]
  );

  const canSubmit = React.useMemo(() => {
    return (
      isNonEmptyString(draft.name) &&
      isNonEmptyString(draft.port) &&
      isNonEmptyString(draft.service)
    );
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ name: "", port: "", service: "" });
    setOriginalRef({ name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      const nextPort = safeTrim(draft.port);
      const nextService = safeTrim(draft.service);

      await saveFwConfigItem("port-protocol", {
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data: {
          name: nextName,
          "port-protocol": { port: nextPort, service: nextService },
        },
      });

      const oldName = safeTrim(originalRef.name);
      const shouldDeleteOld =
        isNonEmptyString(oldName) &&
        oldName !== nextName;
      if (shouldDeleteOld) {
        await deleteFwConfigItem("port-protocol", { name: oldName });
      }

      onCancelEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [draft, originalRef, setLoading, setError, load, onCancelEdit]);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteFwConfigItem("port-protocol", { name: row.name });
      setConfirmDelete({ show: false, row: null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [confirmDelete, setLoading, setError, load]);

  return (
    <>
      <PortProtocolTableView
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onEdit={onEdit}
        onCopy={onCopy}
        onDelete={onDelete}
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
        message={confirmDelete.row ? `Delete '${confirmDelete.row.name}'?` : ""}
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
