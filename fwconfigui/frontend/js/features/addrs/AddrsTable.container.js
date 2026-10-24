function AddrsTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [isPreparingLegacy, setIsPreparingLegacy] = React.useState(false);
  const [isOnboarding, setIsOnboarding] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState("");
  const [usedInGrpModal, setUsedInGrpModal] = React.useState({ isOpen: false, name: "", items: [], loading: false, error: "" });
  const [usedInRuleModal, setUsedInRuleModal] = React.useState({ isOpen: false, name: "", items: [], loading: false, error: "" });
  const [draft, setDraft] = React.useState({
    filename: "addresses.yaml",
    name: "",
    value: "",
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
    setDraft({ filename: "addresses.yaml", name: "", value: "", inFirewall: "" });
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

  const onPrepareLegacyGrp2AddrAppendlist = React.useCallback(async () => {
    if (isPreparingLegacy) return;
    try {
      setIsPreparingLegacy(true);
      setLoading(true);
      setError("");
      await prepareLegacyGrp2AddrAppendlist(env);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setIsPreparingLegacy(false);
    }
  }, [env, isPreparingLegacy, load, setLoading, setError]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({ ...it }));
  }, [items]);

  const duplicateValues = React.useMemo(() => {
    const counts = new Map();
    (items || []).forEach((it) => {
      const v = (safeTrim(it?.data?.ip) || safeTrim(it?.data?.range) || safeTrim(it?.data?.subnet)).toLowerCase();
      if (!v) return;
      counts.set(v, (counts.get(v) || 0) + 1);
    });
    return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([v]) => v));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: { filename: "", name: "", value: "", inFirewall: "", usedInGrp: "", usedInRule: "" },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      name: safeTrim(row.name),
      value: safeTrim(row?.data?.ip) || safeTrim(row?.data?.range) || safeTrim(row?.data?.subnet),
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
    setDraft({ filename: "addresses.yaml", name: "", value: "", inFirewall: "" });
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
    setDraft({
      filename: fn,
      name: n,
      value,
      inFirewall,
    });
    setOriginalRef({ filename: fn, name: n });
    setEditingKey(`${fn}::${n}`);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  function generateUniqueCopyName(existingNames, baseName) {
    const existing = new Set((existingNames || []).map((x) => String(x || "").trim()));
    const base = safeTrim(baseName);
    if (!base) return "";

    const candidate1 = `${base}_copy`;
    if (!existing.has(candidate1)) return candidate1;

    for (let i = 2; i <= 500; i++) {
      const c = `${base}_copy${i}`;
      if (!existing.has(c)) return c;
    }
    return `${base}_copy${Date.now()}`;
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

        const src = row?.data && typeof row.data === "object" ? row.data : {};
        const data = {};
        for (const k of ["ip", "range", "subnet"]) {
          const v = safeTrim(src[k]);
          if (v) data[k] = v;
        }
        if (Array.isArray(src["name-override"]) && src["name-override"].map((x) => safeTrim(x)).filter(Boolean).length > 0) {
          data["name-override"] = src["name-override"].map((x) => safeTrim(x)).filter(Boolean);
        }
        if (src["in-firewall"] !== undefined && src["in-firewall"] !== null) {
          data["in-firewall"] = src["in-firewall"];
        }
        const cs = safeTrim(src["cleanup-strategy"]);
        if (cs) data["cleanup-strategy"] = cs;

        const filename = safeTrim(row?.filename) || "addresses.yaml";
        await saveAddr(env, {
          filename,
          name: nextName,
          data,
        });

        await load();
        onEdit({ filename, name: nextName, data });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [env, items, setLoading, setError, load, onEdit]
  );

  const nameError = React.useMemo(() => {
    const n = safeTrim(draft.name);
    if (!n) return "";
    const unchanged = editingKey !== "__new__" && n.toLowerCase() === safeTrim(originalRef.name).toLowerCase();
    if (unchanged) return "";
    if (!/^[a-z0-9._]+$/.test(n)) return "name must contain only lowercase letters, digits, '.' and '_'";
    return "";
  }, [draft.name, editingKey, originalRef.name]);

  const canSubmit = React.useMemo(() => {
    const hasName = isNonEmptyString(draft.name);
    const hasValue = isNonEmptyString(draft.value);
    return hasName && hasValue && !nameError;
  }, [draft, nameError]);

  const onCancelEdit = React.useCallback(() => {
    setEditingKey("");
    setDraft({ filename: "addresses.yaml", name: "", value: "", inFirewall: "" });
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

      const origRow = (items || []).find(
        (it) => safeTrim(it?.name) === safeTrim(originalRef.name) && (safeTrim(it?.filename) || "addresses.yaml") === (safeTrim(originalRef.filename) || "addresses.yaml")
      );
      const storedNameOverride = Array.isArray(origRow?.data?.["name-override"])
        ? origRow.data["name-override"].map((x) => safeTrim(x)).filter(Boolean)
        : [];

      const data = {
        ...inferred,
        ...(storedNameOverride.length > 0 ? { "name-override": storedNameOverride } : {}),
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
  }, [env, draft, items, originalRef, setLoading, setError, load, onCancelEdit]);

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

  const onOnboard = React.useCallback(
    async (row) => {
      if (isOnboarding) return;
      const n = safeTrim(row?.name);
      const fn = safeTrim(row?.filename) || "addresses.yaml";
      if (!n) return;
      try {
        setIsOnboarding(true);
        setLoading(true);
        setError("");
        await onboardAddrFromFmExtract(env, n);
        setItems((prev) =>
          (Array.isArray(prev) ? prev : []).filter((it) => {
            const itName = safeTrim(it?.name);
            const itFn = safeTrim(it?.filename) || "addresses.yaml";
            return !(itName === n && itFn === fn);
          })
        );
        await load();
      } catch (e) {
        setError(formatError(e));
        await load();
      } finally {
        setLoading(false);
        setIsOnboarding(false);
      }
    },
    [env, isOnboarding, load, setLoading, setError]
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
        duplicateValues={duplicateValues}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onPrepareLegacyGrp2AddrAppendlist={onPrepareLegacyGrp2AddrAppendlist}
        isPreparingLegacy={isPreparingLegacy}
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
        onCopy={onCopy}
        onOnboard={onOnboard}
        isOnboarding={isOnboarding}
        onExclude={onExclude}
        onExcludeEnvCommon={onExcludeEnvCommon}
        editingKey={editingKey}
        draft={draft}
        setDraft={setDraft}
        nameError={nameError}
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
