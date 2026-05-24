function RulesTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({
      ...it,
      filename: safeTrim(it?.filename),
      idx: Number.isFinite(Number(it?.idx)) ? Number(it.idx) : 0,
      data: it?.data && typeof it.data === "object" ? it.data : {},
    }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: {
      appflowid: "",
      source: "",
      destination: "",
      protocolPort: "",
      keywords: "",
      filename: "",
    },
    fieldMapping: (row) => ({
      appflowid: safeTrim(row?.data?.appflowid),
      source: (Array.isArray(row?.data?.["source-list"]) ? row.data["source-list"] : []).join(","),
      destination: (Array.isArray(row?.data?.["destination-list"]) ? row.data["destination-list"] : []).join(","),
      protocolPort: (Array.isArray(row?.data?.["protocol-port"]) ? row.data["protocol-port"] : []).join(","),
      keywords: (Array.isArray(row?.data?.keywords) ? row.data.keywords : []).join(","),
      filename: safeTrim(row?.filename),
    }),
    sortBy: (a, b) => {
      const af = safeTrim(a?.filename).toLowerCase();
      const bf = safeTrim(b?.filename).toLowerCase();
      if (af !== bf) return af.localeCompare(bf);
      const aa = safeTrim(a?.data?.appflowid).toLowerCase();
      const ba = safeTrim(b?.data?.appflowid).toLowerCase();
      if (aa !== ba) return aa.localeCompare(ba);
      return (a?.idx || 0) - (b?.idx || 0);
    },
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await listRules(env);
      setItems(resp?.items || []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, setLoading, setError]);

  React.useEffect(() => {
    load();
  }, [load]);

  return <RulesTableView env={env} rows={sortedRows} filters={filters} setFilters={setFilters} />;
}
