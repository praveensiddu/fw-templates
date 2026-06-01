function IpInventoryTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "" });
  const [originalName, setOriginalName] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const [isImporting, setIsImporting] = React.useState(false);

  const [bulkUpload, setBulkUpload] = React.useState({ isOpen: false, text: "" });

  const [importResult, setImportResult] = React.useState({ show: false, data: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await listIpInventory(env);
      setItems(resp?.items || []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, setLoading, setError]);

  React.useEffect(() => {
    setEditingKey("");
    setDraft({ name: "" });
    setOriginalName("");
    setConfirmDelete({ show: false, row: null });
    setBulkUpload({ isOpen: false, text: "" });
    load();
  }, [env, load]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({ ...it, name: safeTrim(it?.name) }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
    }),
    sortBy: (a, b) => safeTrim(a?.name).toLowerCase().localeCompare(safeTrim(b?.name).toLowerCase()),
  });

  const onAdd = React.useCallback(() => {
    setDraft({ name: "" });
    setOriginalName("");
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const name = safeTrim(row?.name);
    setDraft({ name });
    setOriginalName(name);
    setEditingKey(name);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(safeTrim(draft?.name));
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ name: "" });
    setOriginalName("");
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name);
      await saveIpInventory(env, {
        name: nextName,
        original_name: isNonEmptyString(safeTrim(originalName)) ? safeTrim(originalName) : undefined,
        data: {},
      });

      onCancelEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, draft, originalName, setLoading, setError, load, onCancelEdit]);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteIpInventory(env, row?.name);
      setConfirmDelete({ show: false, row: null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, confirmDelete, setLoading, setError, load]);

  const onImport = React.useCallback(async () => {
    if (isImporting) return;
    try {
      setIsImporting(true);
      setLoading(true);
      setError("");
      const resp = await importIpInventoryFromFortimgr(env);
      setImportResult({ show: true, data: resp || null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setIsImporting(false);
    }
  }, [env, isImporting, setLoading, setError, load]);

  const onOpenBulkUpload = React.useCallback(() => {
    setBulkUpload({ isOpen: true, text: "" });
  }, []);

  const onCloseBulkUpload = React.useCallback(() => {
    setBulkUpload({ isOpen: false, text: "" });
  }, []);

  const onSubmitBulkUpload = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await bulkUploadIpInventory(env, bulkUpload.text);
      onCloseBulkUpload();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, bulkUpload, setLoading, setError, load, onCloseBulkUpload]);

  return (
    <>
      <IpInventoryTableView
        env={env}
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onImport={onImport}
        isImporting={isImporting}
        onOpenBulkUpload={onOpenBulkUpload}
        bulkUpload={bulkUpload}
        setBulkUpload={setBulkUpload}
        onCloseBulkUpload={onCloseBulkUpload}
        onSubmitBulkUpload={onSubmitBulkUpload}
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
        message={confirmDelete.row ? `Delete '${safeTrim(confirmDelete.row.name)}'?` : ""}
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />

      <ConfirmationModal
        show={importResult.show}
        title="Import result"
        message={(() => {
          const d = importResult.data || {};
          const out = safeTrim(d?.output_file);
          const summary = `fortimgr_total=${d?.fortimgr_total ?? ""}, inventory_total=${d?.inventory_total ?? ""}, matched_total=${d?.matched_total ?? ""}, existing_matched_total=${d?.existing_matched_total ?? ""}, existing_conflict_updates=${d?.existing_conflict_updates ?? ""}, unmatched_written_total=${d?.unmatched_written_total ?? ""}`;
          return out ? `${summary}\n\noutput_file: ${out}` : summary;
        })()}
        onClose={() => setImportResult({ show: false, data: null })}
        onConfirm={() => setImportResult({ show: false, data: null })}
        confirmText="Close"
      />
    </>
  );
}
