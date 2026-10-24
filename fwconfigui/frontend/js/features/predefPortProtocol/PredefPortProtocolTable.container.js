function PredefPortProtocolTable({ setLoading, setError }) {
  const FIXED_FILENAME = "predefined-port-protocol.yaml";
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [draft, setDraft] = React.useState({ name: "", aliases: "", description: "", original_name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const aliases = Array.isArray(it?.data?.aliases) ? it.data.aliases : [];
      return {
        ...it,
        name: safeTrim(it?.name),
        aliases,
        description: safeTrim(it?.data?.description),
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { name: "", aliases: "", description: "" },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
      aliases: Array.isArray(row?.aliases) ? row.aliases.join(",") : "",
      description: safeTrim(row?.description),
    }),
    sortBy: (a, b) => safeTrim(a?.name).toLowerCase().localeCompare(safeTrim(b?.name).toLowerCase()),
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await listFwConfigItems("predef-port-protocol");
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
    setDraft({ name: "", aliases: "", description: "", original_name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    setDraft({
      name: safeTrim(row?.name),
      aliases: (Array.isArray(row?.aliases) ? row.aliases : []).join(", "),
      description: safeTrim(row?.description),
      original_name: safeTrim(row?.name),
    });
    setEditingKey(safeTrim(row?.name));
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(draft.name);
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ name: "", aliases: "", description: "", original_name: "" });
  }, []);

  function parseAliases(v) {
    return safeTrim(v)
      ? safeTrim(v)
          .split(",")
          .map((x) => safeTrim(x))
          .filter(Boolean)
      : [];
  }

  function generateUniqueCopyName(existingNames, baseName) {
    const existing = new Set((existingNames || []).map((x) => String(x || "").trim()));
    const base = safeTrim(baseName);
    if (!base) return "";

    const candidate1 = `${base}_COPY`;
    if (!existing.has(candidate1)) return candidate1;

    for (let i = 2; i <= 500; i++) {
      const c = `${base}_COPY${i}`;
      if (!existing.has(c)) return c;
    }
    return `${base}_COPY${Date.now()}`;
  }

  const onCopy = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");

        const allNames = (items || []).map((it) => safeTrim(it?.name)).filter(Boolean);
        const srcName = safeTrim(row?.name);
        const nextName = generateUniqueCopyName(allNames, srcName);
        if (!nextName) throw new Error("Unable to generate copy name");

        const nextAliases = Array.isArray(row?.aliases) ? row.aliases : [];
        const nextDescription = safeTrim(row?.description);
        await saveFwConfigItem("predef-port-protocol", {
          filename: FIXED_FILENAME,
          name: nextName,
          data: {
            name: nextName,
            aliases: nextAliases,
            description: nextDescription,
          },
        });

        await load();
        onEdit({ name: nextName, aliases: nextAliases, description: nextDescription });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [items, setLoading, setError, load, onEdit]
  );

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name)
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");
      const nextAliases = parseAliases(draft.aliases);
      const originalName = safeTrim(draft.original_name);

      await saveFwConfigItem("predef-port-protocol", {
        filename: FIXED_FILENAME,
        name: nextName,
        ...(originalName ? { original_name: originalName } : {}),
        data: { name: nextName, aliases: nextAliases, description: safeTrim(draft.description) },
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
      await deleteFwConfigItem("predef-port-protocol", { filename: FIXED_FILENAME, name: row.name });
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
      <PredefPortProtocolTableView
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onEdit={onEdit}
        onCopy={onCopy}
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
