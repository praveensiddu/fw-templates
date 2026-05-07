function FwRulesTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [portProtocolNames, setPortProtocolNames] = React.useState([]);
  const [businessPurposeNames, setBusinessPurposeNames] = React.useState([]);
  const [envNames, setEnvNames] = React.useState([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    filename: "fw-rules-1.yaml",
    appflowid: "",
    sourceGroup: "",
    sourceEnvs: [],
    destinationGroup: "",
    destinationEnvs: [],
    businessPurpose: "",
    protocolPortRefs: [],
    keywords: "",
    envs: [],
  });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [fwResp, ppResp, bpResp, envResp] = await Promise.all([
        listFwConfigItems("fw-rules"),
        listFwConfigItems("port-protocol"),
        listFwConfigItems("business-purpose"),
        listFwConfigItems("env"),
      ]);

      setItems(fwResp?.items || []);

      const ppNames = (ppResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setPortProtocolNames(ppNames);

      const bpNames = (bpResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setBusinessPurposeNames(bpNames);

      const envs = (envResp?.items || [])
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

  const formatEndpoint = React.useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    const first = arr[0];
    const group = safeTrim(first?.group);
    const envs = Array.isArray(first?.envs) ? first.envs.map((x) => safeTrim(x)).filter(Boolean) : [];
    const envsPart = envs.length ? `[${envs.join(",")}]` : "[]";
    if (!group) return envsPart;
    return `${group} ${envsPart}`;
  }, []);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const refs = Array.isArray(it?.data?.["protocol-port-reference"]) ? it.data["protocol-port-reference"] : [];
      const envs = Array.isArray(it?.data?.envs) ? it.data.envs : [];
      const src = it?.data?.source;
      const dst = it?.data?.destination;
      const keywords = Array.isArray(it?.data?.keywords) ? it.data.keywords : [];
      const appflowid = safeTrim(it?.data?.appflowid);
      return {
        ...it,
        name: safeTrim(it?.name) || appflowid,
        appflowid,
        sourceDisplay: formatEndpoint(src),
        destinationDisplay: formatEndpoint(dst),
        ppref: refs.join(", "),
        bp: safeTrim(it?.data?.business_purpose),
        keywordsDisplay: keywords.map((x) => safeTrim(x)).filter(Boolean).join(", "),
        envsJoined: envs.join(", "),
      };
    });
  }, [items, formatEndpoint]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: {
      filename: "",
      appflowid: "",
      source: "",
      destination: "",
      ppref: "",
      bp: "",
      keywords: "",
      envs: "",
    },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      appflowid: safeTrim(row.appflowid),
      source: safeTrim(row.sourceDisplay),
      destination: safeTrim(row.destinationDisplay),
      ppref: safeTrim(row.ppref),
      bp: safeTrim(row.bp),
      keywords: safeTrim(row.keywordsDisplay),
      envs: safeTrim(row.envsJoined),
    }),
    sortBy: (a, b) => safeTrim(a?.appflowid).localeCompare(safeTrim(b?.appflowid)),
  });

  const onAdd = React.useCallback(() => {
    setForm({
      filename: "fw-rules-1.yaml",
      appflowid: "",
      sourceGroup: "",
      sourceEnvs: [],
      destinationGroup: "",
      destinationEnvs: [],
      businessPurpose: "",
      protocolPortRefs: [],
      keywords: "",
      envs: [],
    });
    setShowForm(true);
  }, []);

  const onEdit = React.useCallback((row) => {
    const refs = Array.isArray(row?.data?.["protocol-port-reference"]) ? row.data["protocol-port-reference"] : [];
    const src0 = Array.isArray(row?.data?.source) && row.data.source.length ? row.data.source[0] : null;
    const dst0 = Array.isArray(row?.data?.destination) && row.data.destination.length ? row.data.destination[0] : null;
    const keywords = Array.isArray(row?.data?.keywords) ? row.data.keywords.join(",") : "";
    setForm({
      filename: safeTrim(row.filename),
      appflowid: safeTrim(row?.data?.appflowid),
      sourceGroup: safeTrim(src0?.group),
      sourceEnvs: Array.isArray(src0?.envs) ? src0.envs : [],
      destinationGroup: safeTrim(dst0?.group),
      destinationEnvs: Array.isArray(dst0?.envs) ? dst0.envs : [],
      protocolPortRefs: refs,
      businessPurpose: safeTrim(row?.data?.business_purpose),
      keywords,
      envs: Array.isArray(row?.data?.envs) ? row.data.envs : [],
    });
    setShowForm(true);
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(form.filename) && isNonEmptyString(form.appflowid);
  }, [form]);

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const refs = Array.isArray(form.protocolPortRefs)
        ? form.protocolPortRefs.map((x) => safeTrim(x)).filter(Boolean)
        : [];
      const envs = Array.isArray(form.envs) ? form.envs.map((x) => safeTrim(x)).filter(Boolean) : [];

      const sourceEnvs = Array.isArray(form.sourceEnvs) ? form.sourceEnvs.map((x) => safeTrim(x)).filter(Boolean) : [];
      const destinationEnvs = Array.isArray(form.destinationEnvs)
        ? form.destinationEnvs.map((x) => safeTrim(x)).filter(Boolean)
        : [];

      const keywords = safeTrim(form.keywords)
        .split(",")
        .map((x) => safeTrim(x))
        .filter(Boolean);

      await saveFwConfigItem("fw-rules", {
        filename: form.filename,
        name: safeTrim(form.appflowid),
        data: {
          name: safeTrim(form.appflowid),
          appflowid: form.appflowid,
          source: [{ group: safeTrim(form.sourceGroup), envs: sourceEnvs }],
          destination: [{ group: safeTrim(form.destinationGroup), envs: destinationEnvs }],
          "protocol-port-reference": refs,
          business_purpose: safeTrim(form.businessPurpose),
          keywords,
          envs,
        },
      });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [form, setLoading, setError, load]);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteFwConfigItem("fw-rules", { filename: row.filename, name: safeTrim(row?.data?.appflowid) || row.name });
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
      <FwRulesTableView
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {showForm ? (
        <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>{isNonEmptyString(form.appflowid) ? "Edit" : "Add"} fw-rule</h3>
              <button className="btn" onClick={() => setShowForm(false)}>
                Close
              </button>
            </div>
            <div className="fieldGrid" style={{ marginTop: 12 }}>
              <div className="field">
                <div className="muted">File</div>
                <input className="input" value={form.filename} onChange={(e) => setForm((p) => ({ ...p, filename: e.target.value }))} />
              </div>
              <div className="field">
                <div className="muted">App Flow ID</div>
                <input className="input" value={form.appflowid} onChange={(e) => setForm((p) => ({ ...p, appflowid: e.target.value }))} />
              </div>
              <div className="field">
                <div className="muted">Source Group</div>
                <input className="input" value={form.sourceGroup} onChange={(e) => setForm((p) => ({ ...p, sourceGroup: e.target.value }))} />
              </div>
              <div className="field">
                <div className="muted">Source Envs</div>
                <select
                  className="input"
                  multiple
                  value={Array.isArray(form.sourceEnvs) ? form.sourceEnvs : []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions || []).map((o) => o.value);
                    setForm((p) => ({ ...p, sourceEnvs: selected }));
                  }}
                  style={{ minHeight: 120 }}
                >
                  {envNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <div className="muted">Destination Group</div>
                <input
                  className="input"
                  value={form.destinationGroup}
                  onChange={(e) => setForm((p) => ({ ...p, destinationGroup: e.target.value }))}
                />
              </div>
              <div className="field">
                <div className="muted">Destination Envs</div>
                <select
                  className="input"
                  multiple
                  value={Array.isArray(form.destinationEnvs) ? form.destinationEnvs : []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions || []).map((o) => o.value);
                    setForm((p) => ({ ...p, destinationEnvs: selected }));
                  }}
                  style={{ minHeight: 120 }}
                >
                  {envNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <div className="muted">Protocol-Port References</div>
                <select
                  className="input"
                  multiple
                  value={Array.isArray(form.protocolPortRefs) ? form.protocolPortRefs : []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions || []).map((o) => o.value);
                    setForm((p) => ({ ...p, protocolPortRefs: selected }));
                  }}
                  style={{ minHeight: 120 }}
                >
                  {portProtocolNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <div className="muted">Business Purpose</div>
                <select
                  className="input"
                  value={safeTrim(form.businessPurpose)}
                  onChange={(e) => setForm((p) => ({ ...p, businessPurpose: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {businessPurposeNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <div className="muted">Keywords (comma-separated)</div>
                <input className="input" value={form.keywords} onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))} />
              </div>
              <div className="field">
                <div className="muted">Envs</div>
                <select
                  className="input"
                  multiple
                  value={Array.isArray(form.envs) ? form.envs : []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions || []).map((o) => o.value);
                    setForm((p) => ({ ...p, envs: selected }));
                  }}
                  style={{ minHeight: 120 }}
                >
                  {envNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modalActions">
              <button className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={!canSubmit} onClick={onSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        show={confirmDelete.show}
        title="Delete item"
        message={
          confirmDelete.row
            ? `Delete '${safeTrim(confirmDelete.row?.data?.appflowid)}' from ${confirmDelete.row.filename}?`
            : ""
        }
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
