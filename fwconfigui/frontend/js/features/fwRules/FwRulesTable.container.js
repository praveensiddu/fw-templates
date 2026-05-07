function MultiSelectPicker({
  options,
  values,
  onChange,
  placeholder,
  inputTestId,
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const normalizedOptions = Array.isArray(options) ? options : [];
  const selected = Array.isArray(values) ? values : [];

  const filteredOptions = React.useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((x) => String(x).toLowerCase().includes(q));
  }, [normalizedOptions, query]);

  function addValue(name) {
    const v = String(name || "").trim();
    if (!v) return;
    const exists = selected.some((x) => String(x).toLowerCase() === v.toLowerCase());
    const nextList = exists ? selected : [...selected, v];
    onChange(nextList);
    setQuery("");
    setOpen(true);
  }

  function removeValue(name) {
    const v = String(name || "").trim();
    if (!v) return;
    const nextList = selected.filter((x) => String(x).toLowerCase() !== v.toLowerCase());
    onChange(nextList);
  }

  return (
    <div
      style={{ position: "relative", flex: 1 }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div
        className="filterInput"
        style={{
          minHeight: 36,
          height: "auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          padding: "6px 8px",
        }}
        onMouseDown={() => setOpen(true)}
      >
        {(selected || []).map((c) => (
          <span
            key={c}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.06)",
              fontSize: 12,
            }}
          >
            <span>{c}</span>
            <button
              type="button"
              className="btn"
              style={{ padding: "0 6px", lineHeight: "16px" }}
              onClick={() => removeValue(c)}
              aria-label={`Remove ${c}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="filterInput"
          style={{
            border: "none",
            outline: "none",
            boxShadow: "none",
            flex: 1,
            minWidth: 160,
            padding: 0,
            margin: 0,
            height: 22,
          }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const first = filteredOptions[0];
              if (first) addValue(first);
              return;
            }
            if (e.key === "Backspace" && !query && (selected || []).length > 0) {
              const last = (selected || [])[(selected || []).length - 1];
              removeValue(last);
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          data-testid={inputTestId}
        />
      </div>

      {open ? (
        <div
          style={{
            position: "absolute",
            zIndex: 10001,
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 8,
            maxHeight: 220,
            overflow: "auto",
          }}
          tabIndex={-1}
        >
          {filteredOptions.length === 0 ? (
            <div className="muted" style={{ padding: 10 }}>
              No matches
            </div>
          ) : (
            filteredOptions.map((c) => (
              <button
                key={c}
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderRadius: 0,
                  padding: "10px 10px",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addValue(c);
                }}
              >
                {c}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function FwRulesTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [portProtocolNames, setPortProtocolNames] = React.useState([]);
  const [portProtocolDisplayByName, setPortProtocolDisplayByName] = React.useState({});
  const [businessPurposeNames, setBusinessPurposeNames] = React.useState([]);
  const [businessPurposeDisplayByName, setBusinessPurposeDisplayByName] = React.useState({});
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

      const ppDisplay = (ppResp?.items || []).reduce((acc, it) => {
        const n = safeTrim(it?.name);
        const pp = it?.data?.["port-protocol"];
        const port = safeTrim(pp?.port);
        const service = safeTrim(pp?.service);
        if (n) {
          const display = port && service ? `${port}-${service}` : port || service || n;
          acc[n] = display;
        }
        return acc;
      }, {});
      setPortProtocolDisplayByName(ppDisplay);

      const bpNames = (bpResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setBusinessPurposeNames(bpNames);

      const bpDisplay = (bpResp?.items || []).reduce((acc, it) => {
        const n = safeTrim(it?.name);
        const bp = safeTrim(it?.data?.["business-purpose"]);
        if (n) {
          acc[n] = bp || n;
        }
        return acc;
      }, {});
      setBusinessPurposeDisplayByName(bpDisplay);

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
        protocolPortDisplay: refs
          .map((r) => {
            const key = safeTrim(r);
            return portProtocolDisplayByName?.[key] || key;
          })
          .filter(Boolean)
          .join(", "),
        businessPurposeDisplay:
          businessPurposeDisplayByName?.[safeTrim(it?.data?.business_purpose)] || safeTrim(it?.data?.business_purpose),
        keywordsDisplay: keywords.map((x) => safeTrim(x)).filter(Boolean).join(", "),
        envsJoined: envs.join(", "),
      };
    });
  }, [items, formatEndpoint, portProtocolDisplayByName, businessPurposeDisplayByName]);

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
      ppref: safeTrim(row.protocolPortDisplay),
      bp: safeTrim(row.businessPurposeDisplay),
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
                <MultiSelectPicker
                  options={envNames}
                  values={Array.isArray(form.sourceEnvs) ? form.sourceEnvs : []}
                  onChange={(next) => setForm((p) => ({ ...p, sourceEnvs: next }))}
                  placeholder="Add env..."
                  inputTestId="fw-rule-edit-source-envs"
                />
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
                <MultiSelectPicker
                  options={envNames}
                  values={Array.isArray(form.destinationEnvs) ? form.destinationEnvs : []}
                  onChange={(next) => setForm((p) => ({ ...p, destinationEnvs: next }))}
                  placeholder="Add env..."
                  inputTestId="fw-rule-edit-destination-envs"
                />
              </div>
              <div className="field">
                <div className="muted">Protocol-Port References</div>
                <MultiSelectPicker
                  options={portProtocolNames}
                  values={Array.isArray(form.protocolPortRefs) ? form.protocolPortRefs : []}
                  onChange={(next) => setForm((p) => ({ ...p, protocolPortRefs: next }))}
                  placeholder="Add protocol-port ref..."
                  inputTestId="fw-rule-edit-protocol-port-refs"
                />
              </div>
              <div className="field">
                <div className="muted">Business Purpose</div>
                <select
                  className="filterInput"
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
                <MultiSelectPicker
                  options={envNames}
                  values={Array.isArray(form.envs) ? form.envs : []}
                  onChange={(next) => setForm((p) => ({ ...p, envs: next }))}
                  placeholder="Add env..."
                  inputTestId="fw-rule-edit-envs"
                />
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
