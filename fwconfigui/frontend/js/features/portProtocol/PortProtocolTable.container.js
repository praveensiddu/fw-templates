function PortProtocolTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ filename: "port-protocol-1.yaml", name: "", port: "", service: "" });
  const [originalRef, setOriginalRef] = React.useState({ filename: "", name: "" });
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
    setDraft({ filename: "port-protocol-1.yaml", name: "", port: "", service: "" });
    setOriginalRef({ filename: "", name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const f = safeTrim(row.filename);
    const n = safeTrim(row.name);
    setDraft({
      filename: f,
      name: n,
      port: safeTrim(row?.data?.["port-protocol"]?.port),
      service: safeTrim(row?.data?.["port-protocol"]?.service),
    });
    setOriginalRef({ filename: f, name: n });
    setEditingKey(`${f}:${n}`);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return (
      isNonEmptyString(draft.filename) &&
      isNonEmptyString(draft.name) &&
      isNonEmptyString(draft.port) &&
      isNonEmptyString(draft.service)
    );
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ filename: "port-protocol-1.yaml", name: "", port: "", service: "" });
    setOriginalRef({ filename: "", name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextFilename = safeTrim(draft.filename);
      const nextName = safeTrim(draft.name)
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const nextPort = safeTrim(draft.port);
      const nextService = safeTrim(draft.service);

      await saveFwConfigItem("port-protocol", {
        filename: nextFilename,
        name: nextName,
        data: {
          name: nextName,
          "port-protocol": { port: nextPort, service: nextService },
        },
      });

      const oldFilename = safeTrim(originalRef.filename);
      const oldName = safeTrim(originalRef.name);
      const shouldDeleteOld =
        isNonEmptyString(oldFilename) &&
        isNonEmptyString(oldName) &&
        (oldFilename !== nextFilename || oldName !== nextName);
      if (shouldDeleteOld) {
        await deleteFwConfigItem("port-protocol", { filename: oldFilename, name: oldName });
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
