function BusinessPurposeTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ filename: "business-purpose-1.yaml", name: "", bp: "" });
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
    initialFilters: { filename: "", name: "", bp: "" },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
      bp: safeTrim(row.bp),
    }),
    sortBy: (a, b) => safeTrim(a?.name).localeCompare(safeTrim(b?.name)),
  });

  const onAdd = React.useCallback(() => {
    setForm({ filename: "business-purpose-1.yaml", name: "", bp: "" });
    setShowForm(true);
  }, []);

  const onEdit = React.useCallback((row) => {
    setForm({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
      bp: safeTrim(row?.data?.["business-purpose"]),
    });
    setShowForm(true);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(form.filename) && isNonEmptyString(form.name) && isNonEmptyString(form.bp);
  }, [form]);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await saveFwConfigItem("business-purpose", {
        filename: form.filename,
        name: form.name,
        data: {
          name: form.name,
          "business-purpose": form.bp,
        },
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
      await deleteFwConfigItem("business-purpose", { filename: row.filename, name: row.name });
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
        onDelete={onDelete}
      />

      {showForm ? (
        <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>{isNonEmptyString(form.name) ? "Edit" : "Add"} business-purpose</h3>
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
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">Business Purpose</div>
                <input className="input" value={form.bp} onChange={(e) => setForm((p) => ({ ...p, bp: e.target.value }))} />
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
