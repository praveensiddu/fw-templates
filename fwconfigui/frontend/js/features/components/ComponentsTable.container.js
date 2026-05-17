function ComponentsTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [networkareaNames, setNetworkareaNames] = React.useState([]);
  const [siteNames, setSiteNames] = React.useState([]);
  const [productNames, setProductNames] = React.useState([]);

  const [activePage, setActivePage] = React.useState("list");
  const [detailsMode, setDetailsMode] = React.useState("add");
  const [originalName, setOriginalName] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    networkarea: "",
    description: "",
    exposedto: [],
    sitesItems: [],
  });

  const [cellEdit, setCellEdit] = React.useState(null);

  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [componentsResp, networkareasResp, sitesResp, productsResp] = await Promise.all([
        listFwConfigItems("components"),
        listFwConfigItems("networkareas"),
        listFwConfigItems("sites"),
        listFwConfigItems("products"),
      ]);

      setItems(componentsResp?.items || []);
      setNetworkareaNames(
        (networkareasResp?.items || [])
          .map((x) => safeTrim(x?.name))
          .filter((x) => x)
          .sort((a, b) => a.localeCompare(b))
      );
      setSiteNames(
        (sitesResp?.items || [])
          .map((x) => safeTrim(x?.name))
          .filter((x) => x)
          .sort((a, b) => a.localeCompare(b))
      );

      setProductNames(
        (productsResp?.items || [])
          .map((x) => safeTrim(x?.name))
          .filter((x) => x)
          .sort((a, b) => a.localeCompare(b))
      );
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const exposedtoOptions = React.useMemo(() => {
    const out = ["ALL", ...(Array.isArray(productNames) ? productNames : [])];
    return Array.from(new Set(out.map((x) => safeTrim(x)).filter(Boolean)));
  }, [productNames]);

  const applyAllRule = React.useCallback((vals) => {
    const xs = (Array.isArray(vals) ? vals : []).map((x) => safeTrim(x)).filter(Boolean);
    const uniq = Array.from(new Set(xs));
    const hasAll = uniq.includes("ALL");
    if (!hasAll) return uniq;
    return ["ALL"];
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const data = it?.data || {};
      const sites = data?.sites && typeof data.sites === "object" ? data.sites : {};

      const envOrder = ["prd", "pac", "rtb", "ent", "dev"];
      const envKeys = [...envOrder.filter((k) => Object.prototype.hasOwnProperty.call(sites || {}, k)), ...Object.keys(sites || {}).filter((k) => !envOrder.includes(k))];
      const sitesLines = envKeys
        .map((k) => {
          const lst = Array.isArray(sites?.[k]) ? sites[k] : [];
          const line = `${k}: ${(lst || []).join(", ")}`;
          return safeTrim(line);
        })
        .filter((x) => x && !x.endsWith(": "));

      return {
        ...it,
        componentname: safeTrim(it?.name),
        networkarea: safeTrim(data?.networkarea),
        description: safeTrim(data?.description),
        exposedto: Array.isArray(data?.exposedto) ? data.exposedto : [],
        sites,
        sitesLines,
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: {
      componentname: "",
      networkarea: "",
      description: "",
      exposedto: "",
      sites: "",
    },
    fieldMapping: (row) => ({
      componentname: safeTrim(row?.componentname),
      networkarea: safeTrim(row?.networkarea),
      description: safeTrim(row?.description),
      exposedto: (Array.isArray(row?.exposedto) ? row.exposedto : []).join(", "),
      sites: (Array.isArray(row?.sitesLines) ? row.sitesLines : []).join("\n"),
    }),
    sortBy: (a, b) => safeTrim(a?.componentname).localeCompare(safeTrim(b?.componentname)),
  });

  const onAdd = React.useCallback(() => {
    setDetailsMode("add");
    setOriginalName("");
    setForm({
      name: "",
      networkarea: "",
      description: "",
      exposedto: [],
      sitesItems: [],
    });
    setActivePage("details");
    setCellEdit(null);

    const p = String(window?.location?.pathname || "");
    const m = p.match(/^\/products\/([^/]+)\//);
    const currentProduct = m ? safeTrim(m[1]) : "";
    const nextPath = currentProduct ? `/products/${encodeURIComponent(currentProduct)}/components/add` : "/components/add";
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, []);

  const onEditName = React.useCallback((row) => {
    const n = safeTrim(row?.name);
    const data = row?.data || {};
    const sites = data?.sites && typeof data.sites === "object" ? data.sites : {};

    const envOrder = ["prd", "pac", "rtb", "ent", "dev"];
    const envKeys = [...envOrder.filter((k) => Object.prototype.hasOwnProperty.call(sites || {}, k)), ...Object.keys(sites || {}).filter((k) => !envOrder.includes(k))];
    const sitesItems = envKeys
      .map((env) => ({ env, sites: Array.isArray(sites?.[env]) ? sites[env] : [] }))
      .filter((x) => isNonEmptyString(x?.env));

    setDetailsMode("edit");
    setOriginalName(n);
    setForm({
      name: n,
      networkarea: safeTrim(data?.networkarea),
      description: safeTrim(data?.description),
      exposedto: applyAllRule(Array.isArray(data?.exposedto) ? data.exposedto : []),
      sitesItems,
    });
    setActivePage("details");
    setCellEdit(null);

    const qp = new URLSearchParams();
    qp.set("name", n);
    const p = String(window?.location?.pathname || "");
    const m = p.match(/^\/products\/([^/]+)\//);
    const currentProduct = m ? safeTrim(m[1]) : "";
    const nextPath = currentProduct
      ? `/products/${encodeURIComponent(currentProduct)}/components/edit?${qp.toString()}`
      : `/components/edit?${qp.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, []);

  const onBack = React.useCallback(() => {
    setActivePage("list");
    setCellEdit(null);

    const p = String(window?.location?.pathname || "");
    const m = p.match(/^\/products\/([^/]+)\//);
    const currentProduct = m ? safeTrim(m[1]) : "";
    const nextPath = currentProduct ? `/products/${encodeURIComponent(currentProduct)}/components` : "/components";
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(form?.name);
  }, [form?.name]);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const name = safeTrim(form?.name);

      const nextSites = {};
      for (const it of Array.isArray(form?.sitesItems) ? form.sitesItems : []) {
        const env = safeTrim(it?.env);
        if (!env) continue;
        const vals = (Array.isArray(it?.sites) ? it.sites : []).map((x) => safeTrim(x)).filter((x) => x);
        if (!Object.prototype.hasOwnProperty.call(nextSites, env)) nextSites[env] = [];
        for (const v of vals) {
          if (!nextSites[env].includes(v)) nextSites[env].push(v);
        }
      }

      await saveFwConfigItem("components", {
        name,
        original_name: detailsMode === "edit" ? (safeTrim(originalName) || undefined) : undefined,
        data: {
          name,
          networkarea: safeTrim(form?.networkarea),
          description: safeTrim(form?.description),
          exposedto: applyAllRule(form?.exposedto),
          sites: nextSites,
        },
      });

      setActivePage("list");
      setCellEdit(null);

      const p = String(window?.location?.pathname || "");
      const m = p.match(/^\/products\/([^/]+)\//);
      const currentProduct = m ? safeTrim(m[1]) : "";
      const nextPath = currentProduct ? `/products/${encodeURIComponent(currentProduct)}/components` : "/components";
      if (`${window.location.pathname}${window.location.search}` !== nextPath) {
        window.history.pushState({}, "", nextPath);
      }
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [form, detailsMode, originalName, setLoading, setError, load, applyAllRule]);

  React.useEffect(() => {
    if (activePage !== "list") return;

    const path = String(window.location.pathname || "");
    if (path !== "/components/edit" && !path.endsWith("/components/edit")) return;

    const qp = new URLSearchParams(window.location.search || "");
    const name = safeTrim(qp.get("name"));
    if (!name) return;

    const match = (items || []).find((it) => safeTrim(it?.name) === name);
    if (match) onEditName(match);
  }, [activePage, items, onEditName]);

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

        const data = row?.data || {};
        await saveFwConfigItem("components", {
          name: nextName,
          data: {
            name: nextName,
            networkarea: safeTrim(data?.networkarea),
            description: safeTrim(data?.description),
            exposedto: Array.isArray(data?.exposedto) ? data.exposedto : [],
            sites: data?.sites && typeof data.sites === "object" ? data.sites : {},
          },
        });

        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [items, setLoading, setError, load]
  );

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteFwConfigItem("components", { name: row.name });
      setConfirmDelete({ show: false, row: null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [confirmDelete, setLoading, setError, load]);

  const isEditingCell = React.useCallback(
    (row, field) => {
      return safeTrim(cellEdit?.row?.name) === safeTrim(row?.name) && safeTrim(cellEdit?.field) === safeTrim(field);
    },
    [cellEdit]
  );

  const onStartCellEdit = React.useCallback((row, field) => {
    const data = row?.data || {};

    const next = {
      key: safeTrim(row?.name),
      row,
      field,
      networkarea: safeTrim(data?.networkarea),
      description: safeTrim(data?.description),
      exposedto: applyAllRule(Array.isArray(data?.exposedto) ? data.exposedto : []),
    };

    setCellEdit(next);
  }, [applyAllRule]);

  const onCancelCellEdit = React.useCallback(() => {
    setCellEdit(null);
  }, []);

  const onSaveCellEdit = React.useCallback(async () => {
    const row = cellEdit?.row;
    if (!row) return;
    const name = safeTrim(row?.name);
    if (!name) return;

    try {
      setLoading(true);
      setError("");

      const data = row?.data || {};

      await saveFwConfigItem("components", {
        name,
        data: {
          name,
          networkarea: isEditingCell(row, "networkarea") ? safeTrim(cellEdit?.networkarea) : safeTrim(data?.networkarea),
          description: isEditingCell(row, "description") ? safeTrim(cellEdit?.description) : safeTrim(data?.description),
          exposedto: isEditingCell(row, "exposedto")
            ? applyAllRule(cellEdit?.exposedto)
            : (Array.isArray(data?.exposedto) ? data.exposedto : []),
          sites: data?.sites && typeof data.sites === "object" ? data.sites : {},
        },
      });

      setCellEdit(null);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [cellEdit, isEditingCell, setLoading, setError, load, applyAllRule]);

  return (
    <>
      {activePage === "details" ? (
        <ComponentsDetailsView
          mode={detailsMode}
          form={form}
          setForm={setForm}
          canSubmit={canSubmit}
          onBack={onBack}
          onSave={onSave}
          networkareaNames={networkareaNames}
          siteNames={siteNames}
          productNames={exposedtoOptions}
          applyAllRule={applyAllRule}
        />
      ) : (
        <ComponentsTableView
          rows={sortedRows}
          filters={filters}
          setFilters={setFilters}
          onAdd={onAdd}
          onEditName={onEditName}
          onCopy={onCopy}
          onDelete={onDelete}
          cellEdit={cellEdit}
          setCellEdit={setCellEdit}
          isEditingCell={isEditingCell}
          onStartCellEdit={onStartCellEdit}
          onCancelCellEdit={onCancelCellEdit}
          onSaveCellEdit={onSaveCellEdit}
          networkareaNames={networkareaNames}
          productNames={exposedtoOptions}
          applyAllRule={applyAllRule}
        />
      )}

      <ConfirmationModal
        show={confirmDelete.show}
        title="Delete item"
        message={confirmDelete.row ? `Delete '${confirmDelete.row.name}'?` : ""}
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
