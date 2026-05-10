function NetworkAreasTable({ setLoading, setError }) {
  const FIXED_FILENAME = "networkareas.yaml";
  const [items, setItems] = React.useState([]);
  const [envNames, setEnvNames] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "", shortname: "", envs: "" });
  const [originalRef, setOriginalRef] = React.useState({ name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const [cellEdit, setCellEdit] = React.useState({ key: "", row: null, field: "", envs: [], shortname: "" });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const envs = Array.isArray(it?.data?.envs) ? it.data.envs : [];
      return {
        ...it,
        name: safeTrim(it?.name),
        shortname: safeTrim(it?.data?.shortname),
        envs,
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", shortname: "", envs: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
      shortname: safeTrim(row?.shortname),
      envs: Array.isArray(row?.envs) ? row.envs.join(",") : "",
    }),
    sortBy: (a, b) => safeTrim(a?.name).toLowerCase().localeCompare(safeTrim(b?.name).toLowerCase()),
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [res, envRes] = await Promise.all([
        listFwConfigItems("networkareas"),
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
    setDraft({ name: "", shortname: "", envs: "" });
    setOriginalRef({ name: "" });
    setEditingKey("__new__");
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(draft.name) && isNonEmptyString(draft.shortname);
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ name: "", shortname: "", envs: "" });
    setOriginalRef({ name: "" });
  }, []);

  const getRowKey = React.useCallback((row) => {
    const n = safeTrim(row?.name);
    return n;
  }, []);

  const onStartCellEdit = React.useCallback(
    (row, field) => {
      const key = getRowKey(row);
      const envs = Array.isArray(row?.data?.envs) ? row.data.envs : [];
      const shortname = safeTrim(row?.data?.shortname);
      setCellEdit({ key, row, field: safeTrim(field), envs, shortname });
    },
    [getRowKey]
  );

  const onCancelCellEdit = React.useCallback(() => {
    setCellEdit({ key: "", row: null, field: "", envs: [], shortname: "" });
  }, []);

  const onSaveCellEdit = React.useCallback(async () => {
    const row = cellEdit.row;
    if (!row) return;
    const name = safeTrim(row?.name);
    if (!name) return;

    try {
      setLoading(true);
      setError("");

      const shortname = (safeTrim(cellEdit?.shortname) || safeTrim(row?.data?.shortname)).toUpperCase();
      await saveFwConfigItem("networkareas", {
        filename: FIXED_FILENAME,
        name,
        data: {
          name,
          shortname,
          envs: Array.isArray(cellEdit.envs) ? cellEdit.envs : (Array.isArray(row?.data?.envs) ? row.data.envs : []),
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
      const nextShortname = safeTrim(draft.shortname)
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      const nextEnvs = safeTrim(draft.envs)
        ? safeTrim(draft.envs)
            .split(",")
            .map((x) => safeTrim(x).toLowerCase())
            .filter(Boolean)
        : [];

      await saveFwConfigItem("networkareas", {
        filename: FIXED_FILENAME,
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data: { name: nextName, shortname: nextShortname, envs: nextEnvs },
      });

      const oldName = safeTrim(originalRef.name);
      const shouldDeleteOld = isNonEmptyString(oldName) && oldName !== nextName;
      if (shouldDeleteOld) {
        await deleteFwConfigItem("networkareas", { filename: FIXED_FILENAME, name: oldName });
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
      await deleteFwConfigItem("networkareas", { filename: FIXED_FILENAME, name: row.name });
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
      <NetworkAreasTableView
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
