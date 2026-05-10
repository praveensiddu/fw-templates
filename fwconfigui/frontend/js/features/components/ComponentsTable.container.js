function ComponentsTable({ setLoading, setError }) {
  const FIXED_FILENAME = "components.yaml";

  const [items, setItems] = React.useState([]);
  const [networkareaNames, setNetworkareaNames] = React.useState([]);
  const [siteNames, setSiteNames] = React.useState([]);

  const [activePage, setActivePage] = React.useState("list");
  const [detailsMode, setDetailsMode] = React.useState("add");
  const [originalName, setOriginalName] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    networkarea: "",
    description: "",
    exposedtoText: "",
    sites_prd: [],
    sites_pac: [],
    sites_rtb: [],
    sites_ent: [],
    sites_dev: [],
  });

  const [cellEdit, setCellEdit] = React.useState(null);

  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [componentsResp, networkareasResp, sitesResp] = await Promise.all([
        listFwConfigItems("components"),
        listFwConfigItems("networkareas"),
        listFwConfigItems("sites"),
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
      const data = it?.data || {};
      const sites = data?.sites && typeof data.sites === "object" ? data.sites : {};
      const getSites = (k) => (Array.isArray(sites?.[k]) ? sites[k] : []);

      return {
        ...it,
        componentname: safeTrim(it?.name),
        networkarea: safeTrim(data?.networkarea),
        description: safeTrim(data?.description),
        exposedto: Array.isArray(data?.exposedto) ? data.exposedto : [],
        sites_prd: getSites("prd"),
        sites_pac: getSites("pac"),
        sites_rtb: getSites("rtb"),
        sites_ent: getSites("ent"),
        sites_dev: getSites("dev"),
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
      sites_prd: "",
      sites_pac: "",
      sites_rtb: "",
      sites_ent: "",
      sites_dev: "",
    },
    fieldMapping: (row) => ({
      componentname: safeTrim(row?.componentname),
      networkarea: safeTrim(row?.networkarea),
      description: safeTrim(row?.description),
      exposedto: (Array.isArray(row?.exposedto) ? row.exposedto : []).join(", "),
      sites_prd: (Array.isArray(row?.sites_prd) ? row.sites_prd : []).join(", "),
      sites_pac: (Array.isArray(row?.sites_pac) ? row.sites_pac : []).join(", "),
      sites_rtb: (Array.isArray(row?.sites_rtb) ? row.sites_rtb : []).join(", "),
      sites_ent: (Array.isArray(row?.sites_ent) ? row.sites_ent : []).join(", "),
      sites_dev: (Array.isArray(row?.sites_dev) ? row.sites_dev : []).join(", "),
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
      exposedtoText: "",
      sites_prd: [],
      sites_pac: [],
      sites_rtb: [],
      sites_ent: [],
      sites_dev: [],
    });
    setActivePage("details");
    setCellEdit(null);

    if (window.location.pathname !== "/components/add") {
      window.history.pushState({}, "", "/components/add");
    }
  }, []);

  const onEditName = React.useCallback((row) => {
    const n = safeTrim(row?.name);
    const data = row?.data || {};
    const sites = data?.sites && typeof data.sites === "object" ? data.sites : {};

    setDetailsMode("edit");
    setOriginalName(n);
    setForm({
      name: n,
      networkarea: safeTrim(data?.networkarea),
      description: safeTrim(data?.description),
      exposedtoText: (Array.isArray(data?.exposedto) ? data.exposedto : []).join(", "),
      sites_prd: Array.isArray(sites?.prd) ? sites.prd : [],
      sites_pac: Array.isArray(sites?.pac) ? sites.pac : [],
      sites_rtb: Array.isArray(sites?.rtb) ? sites.rtb : [],
      sites_ent: Array.isArray(sites?.ent) ? sites.ent : [],
      sites_dev: Array.isArray(sites?.dev) ? sites.dev : [],
    });
    setActivePage("details");
    setCellEdit(null);

    const qp = new URLSearchParams();
    qp.set("name", n);
    const nextPath = `/components/edit?${qp.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, []);

  const onBack = React.useCallback(() => {
    setActivePage("list");
    setCellEdit(null);
    if (window.location.pathname !== "/components") {
      window.history.pushState({}, "", "/components");
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
      const nextSites = {
        prd: Array.isArray(form?.sites_prd) ? form.sites_prd : [],
        pac: Array.isArray(form?.sites_pac) ? form.sites_pac : [],
        rtb: Array.isArray(form?.sites_rtb) ? form.sites_rtb : [],
        ent: Array.isArray(form?.sites_ent) ? form.sites_ent : [],
        dev: Array.isArray(form?.sites_dev) ? form.sites_dev : [],
      };

      await saveFwConfigItem("components", {
        filename: FIXED_FILENAME,
        name,
        original_name: detailsMode === "edit" ? (safeTrim(originalName) || undefined) : undefined,
        data: {
          name,
          networkarea: safeTrim(form?.networkarea),
          description: safeTrim(form?.description),
          exposedto: String(form?.exposedtoText || "")
            .split(",")
            .map((x) => safeTrim(x))
            .filter((x) => x),
          sites: nextSites,
        },
      });

      setActivePage("list");
      setCellEdit(null);
      if (window.location.pathname !== "/components") {
        window.history.pushState({}, "", "/components");
      }
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [form, detailsMode, originalName, setLoading, setError, load]);

  React.useEffect(() => {
    if (activePage !== "list") return;

    const path = String(window.location.pathname || "");
    if (path !== "/components/edit") return;

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
          filename: FIXED_FILENAME,
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
      await deleteFwConfigItem("components", { filename: FIXED_FILENAME, name: row.name });
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
    const sites = data?.sites && typeof data.sites === "object" ? data.sites : {};

    const next = {
      key: safeTrim(row?.name),
      row,
      field,
      networkarea: safeTrim(data?.networkarea),
      description: safeTrim(data?.description),
      exposedtoText: (Array.isArray(data?.exposedto) ? data.exposedto : []).join(", "),
      sites_prd: Array.isArray(sites?.prd) ? sites.prd : [],
      sites_pac: Array.isArray(sites?.pac) ? sites.pac : [],
      sites_rtb: Array.isArray(sites?.rtb) ? sites.rtb : [],
      sites_ent: Array.isArray(sites?.ent) ? sites.ent : [],
      sites_dev: Array.isArray(sites?.dev) ? sites.dev : [],
    };

    setCellEdit(next);
  }, []);

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
      const sites = data?.sites && typeof data.sites === "object" ? data.sites : {};

      const nextSites = {
        prd: isEditingCell(row, "sites_prd") ? (Array.isArray(cellEdit?.sites_prd) ? cellEdit.sites_prd : []) : (Array.isArray(sites?.prd) ? sites.prd : []),
        pac: isEditingCell(row, "sites_pac") ? (Array.isArray(cellEdit?.sites_pac) ? cellEdit.sites_pac : []) : (Array.isArray(sites?.pac) ? sites.pac : []),
        rtb: isEditingCell(row, "sites_rtb") ? (Array.isArray(cellEdit?.sites_rtb) ? cellEdit.sites_rtb : []) : (Array.isArray(sites?.rtb) ? sites.rtb : []),
        ent: isEditingCell(row, "sites_ent") ? (Array.isArray(cellEdit?.sites_ent) ? cellEdit.sites_ent : []) : (Array.isArray(sites?.ent) ? sites.ent : []),
        dev: isEditingCell(row, "sites_dev") ? (Array.isArray(cellEdit?.sites_dev) ? cellEdit.sites_dev : []) : (Array.isArray(sites?.dev) ? sites.dev : []),
      };

      await saveFwConfigItem("components", {
        filename: FIXED_FILENAME,
        name,
        data: {
          name,
          networkarea: isEditingCell(row, "networkarea") ? safeTrim(cellEdit?.networkarea) : safeTrim(data?.networkarea),
          description: isEditingCell(row, "description") ? safeTrim(cellEdit?.description) : safeTrim(data?.description),
          exposedto: isEditingCell(row, "exposedto")
            ? String(cellEdit?.exposedtoText || "")
                .split(",")
                .map((x) => safeTrim(x))
                .filter((x) => x)
            : (Array.isArray(data?.exposedto) ? data.exposedto : []),
          sites: nextSites,
        },
      });

      setCellEdit(null);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [cellEdit, isEditingCell, setLoading, setError, load]);

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
          siteNames={siteNames}
        />
      )}

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
