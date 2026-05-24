function ProductsTable({ setLoading, setError }) {
  const FIXED_FILENAME = "products.yaml";
  const [items, setItems] = React.useState([]);
  const [envNames, setEnvNames] = React.useState([]);
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });
  const [activePage, setActivePage] = React.useState("list");
  const [detailsMode, setDetailsMode] = React.useState("add");
  const [originalName, setOriginalName] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    envs: [],
    description: "",
    templatesRepo: "",
    componentsPrefixListText: "",
    componentsExcludeListText: "",
    includeFlowidsText: "",
    excludeFlowidsText: "",
  });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const data = it?.data || {};
      const envs = Array.isArray(data?.envs) ? data.envs : [];
      const prefixList = Array.isArray(data?.components_prefix_list) ? data.components_prefix_list : [];
      const excludeList = Array.isArray(data?.components_exclude_list) ? data.components_exclude_list : [];
      const includeFlowids = Array.isArray(data?.include_flowids) ? data.include_flowids : [];
      const excludeFlowids = Array.isArray(data?.exclude_flowids) ? data.exclude_flowids : [];
      const templatesRepo = safeTrim(data?.["templates-repo"]);
      return {
        ...it,
        name: safeTrim(it?.name),
        envs,
        description: safeTrim(data?.description),
        templatesRepo,
        componentsPrefixList: prefixList,
        componentsExcludeList: excludeList,
        includeFlowids,
        excludeFlowids,
      };
    });
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: {
      name: "",
      envs: "",
      description: "",
      templatesRepo: "",
      componentsPrefixList: "",
      componentsExcludeList: "",
      includeFlowids: "",
      excludeFlowids: "",
    },
    fieldMapping: (row) => ({
      name: safeTrim(row?.name),
      envs: Array.isArray(row?.envs) ? row.envs.join(",") : "",
      description: safeTrim(row?.description),
      templatesRepo: safeTrim(row?.templatesRepo),
      componentsPrefixList: (Array.isArray(row?.componentsPrefixList) ? row.componentsPrefixList : []).join(","),
      componentsExcludeList: (Array.isArray(row?.componentsExcludeList) ? row.componentsExcludeList : []).join(","),
      includeFlowids: (Array.isArray(row?.includeFlowids) ? row.includeFlowids : []).join(","),
      excludeFlowids: (Array.isArray(row?.excludeFlowids) ? row.excludeFlowids : []).join(","),
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
    setDetailsMode("add");
    setOriginalName("");
    setForm({
      name: "",
      envs: ["pac", "prd"],
      description: "",
      templatesRepo: "",
      componentsPrefixListText: "",
      componentsExcludeListText: "",
      includeFlowidsText: "",
      excludeFlowidsText: "",
    });
    setActivePage("details");
  }, []);

  const onEdit = React.useCallback((row) => {
    const name = safeTrim(row?.name);
    const envs = Array.isArray(row?.envs) ? row.envs : [];
    const desc = safeTrim(row?.description);
    const templatesRepo = safeTrim(row?.templatesRepo);
    const prefixList = Array.isArray(row?.componentsPrefixList) ? row.componentsPrefixList : [];
    const excludeList = Array.isArray(row?.componentsExcludeList) ? row.componentsExcludeList : [];
    const includeFlowids = Array.isArray(row?.includeFlowids) ? row.includeFlowids : [];
    const excludeFlowids = Array.isArray(row?.excludeFlowids) ? row.excludeFlowids : [];

    setDetailsMode("edit");
    setOriginalName(name);
    setForm({
      name,
      envs,
      description: desc,
      templatesRepo,
      componentsPrefixListText: prefixList.join(", "),
      componentsExcludeListText: excludeList.join(", "),
      includeFlowidsText: includeFlowids.join(", "),
      excludeFlowidsText: excludeFlowids.join(", "),
    });
    setActivePage("details");
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    const name = safeTrim(form?.name);
    const envs = Array.isArray(form?.envs) ? form.envs.map((x) => safeTrim(x)).filter(Boolean) : [];
    const description = safeTrim(form?.description);
    const prefixList = safeTrim(form?.componentsPrefixListText)
      ? safeTrim(form.componentsPrefixListText)
          .split(",")
          .map((x) => safeTrim(x))
          .filter(Boolean)
      : [];

    if (!name) return false;
    if (name.length < 2) return false;
    if (!/^[A-Z0-9]+$/.test(name)) return false;
    if (envs.length === 0) return false;
    if (!description) return false;
    if (prefixList.length === 0) return false;
    return true;
  }, [form]);

  const onBack = React.useCallback(() => {
    setActivePage("list");
    setDetailsMode("add");
    setOriginalName("");
    setForm({
      name: "",
      envs: [],
      description: "",
      templatesRepo: "",
      componentsPrefixListText: "",
      componentsExcludeListText: "",
      includeFlowidsText: "",
      excludeFlowidsText: "",
    });
  }, []);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const nextName = safeTrim(form.name)
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^A-Z0-9]/g, "");
      const nextEnvs = (Array.isArray(form.envs) ? form.envs : [])
        .map((x) => safeTrim(x).toLowerCase())
        .filter((x) => x);
      const nextDescription = safeTrim(form.description);
      const nextTemplatesRepo = safeTrim(form.templatesRepo);
      const nextComponentsPrefixList = safeTrim(form.componentsPrefixListText)
        ? safeTrim(form.componentsPrefixListText)
            .split(",")
            .map((x) => safeTrim(x))
            .filter((x) => x)
        : [];
      const nextComponentsExcludeList = safeTrim(form.componentsExcludeListText)
        ? safeTrim(form.componentsExcludeListText)
            .split(",")
            .map((x) => safeTrim(x))
            .filter((x) => x)
        : [];

      const nextIncludeFlowids = safeTrim(form.includeFlowidsText)
        ? safeTrim(form.includeFlowidsText)
            .split(",")
            .map((x) => safeTrim(x).toUpperCase())
            .filter((x) => x)
        : [];

      const nextExcludeFlowids = safeTrim(form.excludeFlowidsText)
        ? safeTrim(form.excludeFlowidsText)
            .split(",")
            .map((x) => safeTrim(x).toUpperCase())
            .filter((x) => x)
        : [];

      await saveFwConfigItem("products", {
        name: nextName,
        original_name: detailsMode === "edit" ? safeTrim(originalName) || undefined : undefined,
        data: {
          name: nextName,
          envs: nextEnvs,
          description: nextDescription,
          "templates-repo": nextTemplatesRepo,
          components_prefix_list: nextComponentsPrefixList,
          components_exclude_list: nextComponentsExcludeList,
          include_flowids: nextIncludeFlowids,
          exclude_flowids: nextExcludeFlowids,
        },
      });

      onBack();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [form, detailsMode, originalName, setLoading, setError, load, onBack]);

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

  const onOpenProduct = React.useCallback((row) => {
    const name = safeTrim(row?.name);
    if (!name) return;
    if (typeof setCurrentProduct === "function") setCurrentProduct(name);
    const nextPath = `/products/${encodeURIComponent(name)}/rule-templates`;
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

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
      {activePage === "details" ? (
        <ProductsDetailsView
          mode={detailsMode}
          form={form}
          setForm={setForm}
          canSubmit={canSubmit}
          onBack={onBack}
          onSave={onSave}
          envNames={envNames}
        />
      ) : (
        <ProductsTableView
          rows={sortedRows}
          filters={filters}
          setFilters={setFilters}
          onAdd={onAdd}
          onEdit={onEdit}
          onOpenProduct={onOpenProduct}
          onDelete={onDelete}
          onImport={onImport}
        />
      )}

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
