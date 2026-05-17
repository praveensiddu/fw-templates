function BusinessPurposeTable({ setLoading, setError }) {
  const FIXED_FILENAME = "business-purpose.yaml";
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "", bp: "" });
  const [originalRef, setOriginalRef] = React.useState({ name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await listFwConfigItems("business-purpose");
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
    return (items || []).map((it) => ({
      ...it,
      bp: safeTrim(it?.data?.["business-purpose"]),
    }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", bp: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row.name),
      bp: safeTrim(row.bp),
    }),
    sortBy: (a, b) => safeTrim(a?.name).localeCompare(safeTrim(b?.name)),
  });

  const onAdd = React.useCallback(() => {
    setDraft({ name: "", bp: "" });
    setOriginalRef({ name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const n = safeTrim(row.name);
    setDraft({
      name: n,
      bp: safeTrim(row?.data?.["business-purpose"]),
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
        await saveFwConfigItem("business-purpose", {
          filename: FIXED_FILENAME,
          name: nextName,
          data: {
            name: nextName,
            "business-purpose": safeTrim(data?.["business-purpose"]),
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
    return isNonEmptyString(draft.name) && isNonEmptyString(draft.bp);
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ name: "", bp: "" });
    setOriginalRef({ name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      const nextBp = safeTrim(draft.bp);

      await saveFwConfigItem("business-purpose", {
        filename: FIXED_FILENAME,
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data: {
          name: nextName,
          "business-purpose": nextBp,
        },
      });

      const oldName = safeTrim(originalRef.name);
      const shouldDeleteOld =
        isNonEmptyString(oldName) &&
        oldName !== nextName;
      if (shouldDeleteOld) {
        await deleteFwConfigItem("business-purpose", { filename: FIXED_FILENAME, name: oldName });
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
      await deleteFwConfigItem("business-purpose", { filename: FIXED_FILENAME, name: row.name });
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
      <BusinessPurposeTableView
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
        message={confirmDelete.row ? `Delete '${confirmDelete.row.name}' from ${confirmDelete.row.filename}?` : ""}
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
