function RuleFilesTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "" });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({
      ...it,
      name: safeTrim(it?.name),
    }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
    }),
    sortBy: (a, b) => safeTrim(a?.name).toLowerCase().localeCompare(safeTrim(b?.name).toLowerCase()),
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listFwConfigItems("rule-files");
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
    setDraft({ name: "" });
    setEditingKey("__new__");
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const name = safeTrim(draft?.name);
      if (!name) throw new Error("name is required");
      await saveFwConfigItem("rule-files", {
        filename: "rule-files.yaml",
        name,
        data: { name },
      });
      setEditingKey("");
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [draft, setLoading, setError, load]);

  const onDelete = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");
        await deleteFwConfigItem("rule-files", {
          filename: "rule-files.yaml",
          name: safeTrim(row?.name),
        });
        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, load]
  );

  return (
    <RuleFilesTableView
      rows={sortedRows}
      filters={filters}
      setFilters={setFilters}
      onAdd={onAdd}
      onDelete={onDelete}
      editingKey={editingKey}
      setEditingKey={setEditingKey}
      draft={draft}
      setDraft={setDraft}
      onSave={onSave}
    />
  );
}
