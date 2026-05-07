function KeywordsTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ filename: "keywords-1.yaml", name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await listFwConfigItems("keywords");
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
    return (items || []).map((it) => ({ ...it }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { filename: "", name: "" },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
    }),
    sortBy: (a, b) => safeTrim(a?.name).localeCompare(safeTrim(b?.name)),
  });

  const onAdd = React.useCallback(() => {
    setForm({ filename: "keywords-1.yaml", name: "" });
    setShowForm(true);
  }, []);

  const onEdit = React.useCallback((row) => {
    setForm({ filename: safeTrim(row.filename), name: safeTrim(row.name) });
    setShowForm(true);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(form.filename) && isNonEmptyString(form.name);
  }, [form]);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await saveFwConfigItem("keywords", {
        filename: form.filename,
        name: form.name,
        data: { name: form.name },
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [form, setLoading, setError, load]);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteFwConfigItem("keywords", { filename: row.filename, name: row.name });
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
      <KeywordsTableView
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {showForm ? (
        <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>{isNonEmptyString(form.name) ? "Edit" : "Add"} keyword</h3>
              <button className="btn" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <div className="fieldGrid" style={{ marginTop: 12 }}>
              <div className="field">
                <div className="muted">File</div>
                <input className="input" value={form.filename} onChange={(e) => setForm((p) => ({ ...p, filename: e.target.value }))} />
              </div>
              <div className="field">
                <div className="muted">Name</div>
                <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="modalActions">
              <button className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={!canSubmit} onClick={onSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
