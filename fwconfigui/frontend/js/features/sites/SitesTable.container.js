function SitesTable({ setLoading, setError }) {
  const FIXED_FILENAME = "sites.yaml";
  const [items, setItems] = React.useState([]);
  const [envNames, setEnvNames] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "", envs: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const [cellEdit, setCellEdit] = React.useState({ key: "", row: null, envs: [] });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const envs = Array.isArray(it?.data?.envs) ? it.data.envs : [];
      return {
        ...it,
        name: safeTrim(it?.name),
        envs,
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", envs: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
      envs: Array.isArray(row?.envs) ? row.envs.join(",") : "",
    }),
    sortBy: (a, b) => safeTrim(a?.name).toLowerCase().localeCompare(safeTrim(b?.name).toLowerCase()),
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [res, envRes] = await Promise.all([
        listFwConfigItems("sites"),
        listFwConfigItems("env"),
      ]);
      setItems(res?.items || []);

      const envs = (envRes?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setEnvNames(envs);
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
    setDraft({ name: "", envs: "pac, prd" });
    setEditingKey("__new__");
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(draft.name);
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ name: "", envs: "" });
  }, []);

  const getRowKey = React.useCallback((row) => {
    const n = safeTrim(row?.name);
    return n;
  }, []);

  const onStartCellEdit = React.useCallback(
    (row) => {
      const key = getRowKey(row);
      const envs = Array.isArray(row?.data?.envs) ? row.data.envs : [];
      setCellEdit({ key, row, envs });
    },
    [getRowKey]
  );

  const onCancelCellEdit = React.useCallback(() => {
    setCellEdit({ key: "", row: null, envs: [] });
  }, []);

  const onSaveCellEdit = React.useCallback(async () => {
    const row = cellEdit.row;
    if (!row) return;
    const name = safeTrim(row?.name);
    if (!name) return;

    try {
      setLoading(true);
      setError("");

      await saveFwConfigItem("sites", {
        filename: FIXED_FILENAME,
        name,
        original_name: name,
        data: {
          name,
          envs: Array.isArray(cellEdit.envs) ? cellEdit.envs : [],
        },
      });

      onCancelCellEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [cellEdit, setLoading, setError, load, onCancelCellEdit]);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      const nextEnvs = safeTrim(draft.envs)
        ? safeTrim(draft.envs)
            .split(",")
            .map((x) => safeTrim(x).toLowerCase())
            .filter(Boolean)
        : [];

      await saveFwConfigItem("sites", {
        filename: FIXED_FILENAME,
        name: nextName,
        data: { name: nextName, envs: nextEnvs },
      });

      onCancelEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [draft, setLoading, setError, load, onCancelEdit]);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteFwConfigItem("sites", { filename: FIXED_FILENAME, name: row.name });
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
      <SitesTableView
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onDelete={onDelete}
        editingKey={editingKey}
        draft={draft}
        setDraft={setDraft}
        canSubmit={canSubmit}
        onCancelEdit={onCancelEdit}
        onSave={onSave}
        envNames={envNames}
        cellEdit={cellEdit}
        setCellEdit={setCellEdit}
        onStartCellEdit={onStartCellEdit}
        onCancelCellEdit={onCancelCellEdit}
        onSaveCellEdit={onSaveCellEdit}
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
