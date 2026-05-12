function ProductsTable({ setLoading, setError }) {
  const FIXED_FILENAME = "products.yaml";
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "", description: "" });
  const [originalRef, setOriginalRef] = React.useState({ name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const data = it?.data || {};
      return {
        ...it,
        name: safeTrim(it?.name),
        description: safeTrim(data?.description),
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", description: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
      description: safeTrim(row?.description),
    }),
    sortBy: (a, b) => safeTrim(a?.name).toLowerCase().localeCompare(safeTrim(b?.name).toLowerCase()),
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listFwConfigItems("products");
      setItems(res?.items || []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onAdd = React.useCallback(() => {
    setDraft({ name: "", description: "" });
    setOriginalRef({ name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const name = safeTrim(row?.name);
    if (!name) return;
    setDraft({ name, description: safeTrim(row?.data?.description) });
    setOriginalRef({ name });
    setEditingKey(name);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(draft.name);
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ name: "", description: "" });
    setOriginalRef({ name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      const nextDescription = safeTrim(draft.description);

      await saveFwConfigItem("products", {
        filename: FIXED_FILENAME,
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data: { name: nextName, description: nextDescription },
      });

      const oldName = safeTrim(originalRef.name);
      const shouldDeleteOld = isNonEmptyString(oldName) && oldName !== nextName;
      if (shouldDeleteOld) {
        await deleteFwConfigItem("products", { filename: FIXED_FILENAME, name: oldName });
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
      await deleteFwConfigItem("products", { filename: FIXED_FILENAME, name: row.name });
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
      <ProductsTableView
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onEdit={onEdit}
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
        message={confirmDelete.row ? `Delete '${confirmDelete.row.name}' from ${FIXED_FILENAME}?` : ""}
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
