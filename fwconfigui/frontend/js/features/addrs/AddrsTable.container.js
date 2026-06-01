function AddrsTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [editingKey, setEditingKey] = React.useState("");
  const [usedInGrpModal, setUsedInGrpModal] = React.useState({ isOpen: false, name: "", items: [], loading: false, error: "" });
  const [usedInRuleModal, setUsedInRuleModal] = React.useState({ isOpen: false, name: "", items: [], loading: false, error: "" });
  const [draft, setDraft] = React.useState({
    filename: "addresses.yaml",
    name: "",
    value: "",
    nameOverride: [],
    nameOverrideText: "",
    inFirewall: "",
  });
  const [originalRef, setOriginalRef] = React.useState({ filename: "addresses.yaml", name: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });
  const [isCheckingUsed, setIsCheckingUsed] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await listAddrs(env);
      setItems(resp?.items || []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, setLoading, setError]);

  React.useEffect(() => {
    setEditingKey("");
    setDraft({ filename: "addresses.yaml", name: "", value: "", nameOverride: [], nameOverrideText: "", inFirewall: "" });
    setOriginalRef({ filename: "addresses.yaml", name: "" });
    setConfirmDelete({ show: false, row: null });
    setUsedInGrpModal({ isOpen: false, name: "", items: [], loading: false, error: "" });
    setUsedInRuleModal({ isOpen: false, name: "", items: [], loading: false, error: "" });
    load();
  }, [env, load]);

  const onCheckUsed = React.useCallback(async () => {
    if (isCheckingUsed) return;
    try {
      setIsCheckingUsed(true);
      setLoading(true);
      setError("");
      await checkAddrUsedInGroups(env);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setIsCheckingUsed(false);
    }
  }, [env, isCheckingUsed, load, setLoading, setError]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({ ...it }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { filename: "", name: "", value: "", nameOverride: "", inFirewall: "", usedInGrp: "", usedInRule: "" },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
      value: safeTrim(row?.data?.ip) || safeTrim(row?.data?.range) || safeTrim(row?.data?.subnet),
      nameOverride: Array.isArray(row?.data?.["name-override"]) ? row.data["name-override"].map((x) => safeTrim(x)).filter(Boolean).join("\n") : "empty",
      inFirewall: (() => {
        const v = row?.data?.["in-firewall"];
        if (v === true) return "true";
        if (v === false) return "false";
        const s = safeTrim(v).toLowerCase();
        return s || "empty";
      })(),
      usedInGrp: (() => {
        const v = row?.data?.["used-in-grp"];
        if (v === null || v === undefined) return "empty";
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return "empty";
        return String(n);
      })(),
      usedInRule: (() => {
        const v = row?.data?.["used-in-rule"];
        if (v === true) return "true";
        if (v === false) return "false";
        const s = safeTrim(v).toLowerCase();
        return s || "empty";
      })(),
    }),
    sortBy: (a, b) => {
      const af = safeTrim(a?.filename).toLowerCase();
      const bf = safeTrim(b?.filename).toLowerCase();
      if (af !== bf) return af.localeCompare(bf);
      return safeTrim(a?.name).localeCompare(safeTrim(b?.name));
    },
  });

  const onAdd = React.useCallback(() => {
    setDraft({ filename: "addresses.yaml", name: "", value: "", nameOverride: [], nameOverrideText: "", inFirewall: "" });
    setOriginalRef({ filename: "addresses.yaml", name: "" });
    setEditingKey("__new__");
  }, []);

  const onEdit = React.useCallback((row) => {
    const n = safeTrim(row.name);
    const fn = safeTrim(row.filename) || "addresses.yaml";
    const data = row?.data && typeof row.data === "object" ? row.data : {};
    const value = safeTrim(data.ip) || safeTrim(data.range) || safeTrim(data.subnet);
    const rawInFirewall = data["in-firewall"];
    const inFirewall = rawInFirewall === true ? "true" : rawInFirewall === false ? "false" : safeTrim(rawInFirewall);
    const rawNo = data["name-override"];
    const nameOverride = Array.isArray(rawNo) ? rawNo.map((x) => safeTrim(x)).filter(Boolean) : [];
    setDraft({
      filename: fn,
      name: n,
      value,
      nameOverride,
      nameOverrideText: nameOverride.join(" "),
      inFirewall,
    });
    setOriginalRef({ filename: fn, name: n });
    setEditingKey(`${fn}::${n}`);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    const hasName = isNonEmptyString(draft.name);
    const hasValue = isNonEmptyString(draft.value);
    return hasName && hasValue;
  }, [draft]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ filename: "addresses.yaml", name: "", value: "", nameOverride: [], nameOverrideText: "", inFirewall: "" });
    setOriginalRef({ filename: "addresses.yaml", name: "" });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(draft.name);

      const nextFilename = safeTrim(draft.filename) || "addresses.yaml";

      const rawValue = safeTrim(draft.value);
      const inferred = (() => {
        if (rawValue.includes("-")) return { range: rawValue };
        if (rawValue.includes("/")) return { subnet: rawValue };
        return { ip: rawValue };
      })();

      const data = {
        ...inferred,
        ...(Array.isArray(draft.nameOverride) && draft.nameOverride.map((x) => safeTrim(x)).filter(Boolean).length > 0
          ? { "name-override": draft.nameOverride.map((x) => safeTrim(x)).filter(Boolean) }
          : {}),
      };

      await saveAddr(env, {
        filename: nextFilename,
        name: nextName,
        original_name: safeTrim(originalRef.name) || undefined,
        data,
      });

      onCancelEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, draft, originalRef, setLoading, setError, load, onCancelEdit]);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteAddr(env, row?.name, row?.filename);
      setConfirmDelete({ show: false, row: null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, confirmDelete, setLoading, setError, load]);

  const onExclude = React.useCallback(
    async (row) => {
      const n = safeTrim(row?.name);
      const fn = safeTrim(row?.filename) || "addresses.yaml";
      try {
        setLoading(true);
        setError("");
        await excludeAddrFromImport(env, n);
        setItems((prev) =>
          (Array.isArray(prev) ? prev : []).filter((it) => {
            const itName = safeTrim(it?.name);
            const itFn = safeTrim(it?.filename) || "addresses.yaml";
            return !(itName === n && itFn === fn);
          })
        );
        await deleteAddr(env, n, fn);
      } catch (e) {
        setError(formatError(e));
        await load();
      } finally {
        setLoading(false);
      }
    },
    [env, setLoading, setError, load]
  );

  const onExcludeEnvCommon = React.useCallback(
    async (row) => {
      const n = safeTrim(row?.name);
      const fn = safeTrim(row?.filename) || "addresses.yaml";
      try {
        setLoading(true);
        setError("");
        await excludeAddrFromEnvCommon(env, n);
        setItems((prev) =>
          (Array.isArray(prev) ? prev : []).filter((it) => {
            const itName = safeTrim(it?.name);
            const itFn = safeTrim(it?.filename) || "addresses.yaml";
            return !(itName === n && itFn === fn);
          })
        );
        await deleteAddr(env, n, fn);
      } catch (e) {
        setError(formatError(e));
        await load();
      } finally {
        setLoading(false);
      }
    },
    [env, setLoading, setError, load]
  );

  const onShowUsedInGroups = React.useCallback(
    async (row) => {
      const name = safeTrim(row?.name);
      if (!name) return;
      try {
        setUsedInGrpModal({ isOpen: true, name, items: [], loading: true, error: "" });
        const resp = await getAddrUsedInGroups(env, name);
        const list = Array.isArray(resp?.items) ? resp.items : [];
        setUsedInGrpModal({ isOpen: true, name, items: list, loading: false, error: "" });
      } catch (e) {
        setUsedInGrpModal({ isOpen: true, name, items: [], loading: false, error: formatError(e) });
      }
    },
    [env]
  );

  const onShowUsedInRules = React.useCallback(
    async (row) => {
      const name = safeTrim(row?.name);
      if (!name) return;
      try {
        setUsedInRuleModal({ isOpen: true, name, items: [], loading: true, error: "" });
        const resp = await getAddrUsedInRules(env, name);
        const list = Array.isArray(resp?.items) ? resp.items : [];
        setUsedInRuleModal({ isOpen: true, name, items: list, loading: false, error: "" });
      } catch (e) {
        setUsedInRuleModal({ isOpen: true, name, items: [], loading: false, error: formatError(e) });
      }
    },
    [env]
  );

  return (
    <>
      <AddrsTableView
        env={env}
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onCheckUsed={onCheckUsed}
        isCheckingUsed={isCheckingUsed}
        onShowUsedInGroups={onShowUsedInGroups}
        onShowUsedInRules={onShowUsedInRules}
        usedInGrpModal={usedInGrpModal}
        setUsedInGrpModal={setUsedInGrpModal}
        usedInRuleModal={usedInRuleModal}
        setUsedInRuleModal={setUsedInRuleModal}
        onEdit={onEdit}
        onDelete={onDelete}
        onExclude={onExclude}
        onExcludeEnvCommon={onExcludeEnvCommon}
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
        message={
          confirmDelete.row
            ? `Delete '${confirmDelete.row.name}' from '${safeTrim(confirmDelete.row.filename) || "addresses.yaml"}'?`
            : ""
        }
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
