function PortProtocolTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ filename: "port-protocol-1.yaml", name: "", port: "", service: "" });
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
    initialFilters: { filename: "", name: "", port: "", service: "" },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
      port: safeTrim(row.port),
      service: safeTrim(row.service),
    }),
    sortBy: (a, b) => safeTrim(a?.name).localeCompare(safeTrim(b?.name)),
  });

  const onAdd = React.useCallback(() => {
    setForm({ filename: "port-protocol-1.yaml", name: "", port: "", service: "" });
    setShowForm(true);
  }, []);

  const onEdit = React.useCallback((row) => {
    setForm({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
      port: safeTrim(row?.data?.["port-protocol"]?.port),
      service: safeTrim(row?.data?.["port-protocol"]?.service),
    });
    setShowForm(true);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(form.filename) && isNonEmptyString(form.name) && isNonEmptyString(form.port) && isNonEmptyString(form.service);
  }, [form]);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await saveFwConfigItem("port-protocol", {
        filename: form.filename,
        name: form.name,
        data: {
          name: form.name,
          "port-protocol": { port: form.port, service: form.service },
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
      await deleteFwConfigItem("port-protocol", { filename: row.filename, name: row.name });
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
        onDelete={onDelete}
      />

      {showForm ? (
        <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>{isNonEmptyString(form.name) ? "Edit" : "Add"} port-protocol</h3>
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
              <div className="field">
                <div className="muted">Port</div>
                <input className="input" value={form.port} onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))} />
              </div>
              <div className="field">
                <div className="muted">Service</div>
                <input className="input" value={form.service} onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))} />
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
