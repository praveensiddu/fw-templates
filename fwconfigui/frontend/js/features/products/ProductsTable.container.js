function ProductsTable({ setLoading, setError }) {
  const FIXED_FILENAME = "products.yaml";
  const [items, setItems] = React.useState([]);
  const [envNames, setEnvNames] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "", envs: [], description: "", componentsPrefixListText: "", componentsExcludeListText: "" });
  const [originalRef, setOriginalRef] = React.useState({ name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const data = it?.data || {};
      const envs = Array.isArray(data?.envs) ? data.envs : [];
      const prefixList = Array.isArray(data?.components_prefix_list) ? data.components_prefix_list : [];
      const excludeList = Array.isArray(data?.components_exclude_list) ? data.components_exclude_list : [];
      return {
        ...it,
        name: safeTrim(it?.name),
        envs,
        description: safeTrim(data?.description),
        componentsPrefixList: prefixList,
        componentsExcludeList: excludeList,
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", envs: "", description: "", componentsPrefixList: "", componentsExcludeList: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
      envs: Array.isArray(row?.envs) ? row.envs.join(",") : "",
      description: safeTrim(row?.description),
      componentsPrefixList: (Array.isArray(row?.componentsPrefixList) ? row.componentsPrefixList : []).join(","),
      componentsExcludeList: (Array.isArray(row?.componentsExcludeList) ? row.componentsExcludeList : []).join(","),
    }),
    sortBy: (a, b) => safeTrim(a?.name).toLowerCase().localeCompare(safeTrim(b?.name).toLowerCase()),
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [res, envRes] = await Promise.all([
        listFwConfigItems("products"),
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
    setDraft({ name: "", envs: [], description: "", componentsPrefixListText: "", componentsExcludeListText: "" });
    setOriginalRef({ name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const name = safeTrim(row?.name);
    if (!name) return;
    const envs = Array.isArray(row?.data?.envs) ? row.data.envs : [];
    const prefixList = Array.isArray(row?.data?.components_prefix_list) ? row.data.components_prefix_list : [];
    const excludeList = Array.isArray(row?.data?.components_exclude_list) ? row.data.components_exclude_list : [];
    setDraft({
      name,
      envs: Array.isArray(envs) ? envs : [],
      description: safeTrim(row?.data?.description),
      componentsPrefixListText: (prefixList || []).join(", "),
      componentsExcludeListText: (excludeList || []).join(", "),
    });
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
    setDraft({ name: "", envs: [], description: "", componentsPrefixListText: "", componentsExcludeListText: "" });
    setOriginalRef({ name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      const nextEnvs = (Array.isArray(draft.envs) ? draft.envs : [])
        .map((x) => safeTrim(x).toLowerCase())
        .filter((x) => x);
      const nextDescription = safeTrim(draft.description);
      const nextComponentsPrefixList = safeTrim(draft.componentsPrefixListText)
        ? safeTrim(draft.componentsPrefixListText)
            .split(",")
            .map((x) => safeTrim(x))
            .filter((x) => x)
        : [];
      const nextComponentsExcludeList = safeTrim(draft.componentsExcludeListText)
        ? safeTrim(draft.componentsExcludeListText)
            .split(",")
            .map((x) => safeTrim(x))
            .filter((x) => x)
        : [];

      await saveFwConfigItem("products", {
        filename: FIXED_FILENAME,
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data: {
          name: nextName,
          envs: nextEnvs,
          description: nextDescription,
          components_prefix_list: nextComponentsPrefixList,
          components_exclude_list: nextComponentsExcludeList,
        },
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

  const onImport = React.useCallback(
    async (row) => {
      try {
        const name = safeTrim(row?.name);
        if (!name) return;
        setLoading(true);
        setError("");
        await postJson("/api/v1/fwconfig/products/import", { name });
        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, load]
  );

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
        onImport={onImport}
        editingKey={editingKey}
        draft={draft}
        setDraft={setDraft}
        canSubmit={canSubmit}
        onCancelEdit={onCancelEdit}
        onSave={onSave}
        envNames={envNames}
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
