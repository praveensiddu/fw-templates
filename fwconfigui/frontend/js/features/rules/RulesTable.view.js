const RULE_COLUMNS = [
  {
    key: "appflowid",
    label: "appflowid",
    helpPath: "/static/help/rules/appflowid.html",
    width: 120,
    filterKey: "appflowid",
    filterPlaceholder: "Filter appflowid...",
    defaultHidden: true,
    render: (r, d) => <td style={{ fontWeight: 650 }}>{safeTrim(d.appflowid)}</td>,
  },
  {
    key: "source",
    label: "source-list",
    helpPath: "/static/help/rules/source-list.html",
    width: 260,
    filterKey: "source",
    filterPlaceholder: "Filter source-list...",
    render: (r, d) => (
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(Array.isArray(d["source-list"]) ? d["source-list"] : []).map((g, i) => (
            <div key={i} style={{ padding: "4px 6px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)" }}>
              {safeTrim(g)}
            </div>
          ))}
        </div>
      </td>
    ),
  },
  {
    key: "destination",
    label: "destination-list",
    helpPath: "/static/help/rules/destination-list.html",
    width: 260,
    filterKey: "destination",
    filterPlaceholder: "Filter destination-list...",
    render: (r, d) => (
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(Array.isArray(d["destination-list"]) ? d["destination-list"] : []).map((g, i) => (
            <div key={i} style={{ padding: "4px 6px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)" }}>
              {safeTrim(g)}
            </div>
          ))}
        </div>
      </td>
    ),
  },
  {
    key: "protocolPort",
    label: "protocol-port-map",
    helpPath: "/static/help/rules/protocol-port-map.html",
    width: 260,
    filterKey: "protocolPort",
    filterPlaceholder: "Filter protocol-port-map...",
    render: (r, d) => (
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(Array.isArray(d["protocol-port-map"]) ? d["protocol-port-map"] : []).map((x, i) => {
            const proto = x && typeof x === "object" ? safeTrim(x["protocol-port"]) : safeTrim(x);
            const svc = x && typeof x === "object" ? safeTrim(x.service_offered) : "";
            return (
              <div key={i} style={{ padding: "4px 6px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)" }}>
                {svc ? `${proto} (${svc})` : proto}
              </div>
            );
          })}
        </div>
      </td>
    ),
  },
  {
    key: "businessPurpose",
    label: "business purpose",
    helpPath: "/static/help/rules/business-purpose.html",
    width: 200,
    filterKey: "businessPurpose",
    filterPlaceholder: "Filter business purpose...",
    render: (r, d) => (
      <td className="muted"><div style={{ whiteSpace: "pre-line" }}>{safeTrim(d["business-purpose"]) || "empty"}</div></td>
    ),
  },
  {
    key: "keywords",
    label: "kws",
    helpPath: "/static/help/rules/kws.html",
    width: 160,
    filterKey: "keywords",
    filterPlaceholder: "Filter kws...",
    render: (r, d) => <td><div style={{ whiteSpace: "pre-line" }}>{(Array.isArray(d.keywords) ? d.keywords : []).join(", ")}</div></td>,
  },
  {
    key: "inFw",
    label: "IN-FW",
    helpPath: "/static/help/rules/in-fw.html",
    width: 120,
    filterKey: "inFw",
    filterPlaceholder: "Filter IN-FW...",
    render: (r, d) => <td className="muted">{safeTrim(d["IN-FW"]) || "empty"}</td>,
  },
  {
    key: "file",
    label: "file",
    helpPath: "/static/help/rules/file.html",
    width: 220,
    filterKey: "filename",
    filterPlaceholder: "Filter file...",
    defaultHidden: true,
    render: (r) => <td><div style={{ whiteSpace: "pre-line" }}>{safeTrim(r?.filename)}</div></td>,
  },
  {
    key: "actions",
    label: "Actions",
    width: 100,
    fixed: true,
    render: (r, d, { onEdit, onEditYaml, onCopy, onDelete }) => (
      <td>
        <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => onEdit(r)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </button>
        <button className="iconBtn" title="Edit YAML" onClick={() => onEditYaml(r)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
        </button>
        <button className="iconBtn" title="Copy" onClick={() => onCopy(r)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button className="iconBtn iconBtn-danger" title="Delete" onClick={() => onDelete(r)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </td>
    ),
  },
];

function RulesTableView({ env, rows, allRows, filters, setFilters, urlFilterNote, onAdd, onEdit, onEditYaml, onCopy, onDelete }) {
  const [colMenuOpen, setColMenuOpen] = React.useState(false);
  const [queryOpen, setQueryOpen] = React.useState(false);
  const [queryMode, setQueryMode] = React.useState("flowids");
  const [queryPicks, setQueryPicks] = React.useState({ flowids: [], keywords: [] });
  const [copyMsg, setCopyMsg] = React.useState("");

  const queryOptions = React.useMemo(() => {
    const flows = new Set();
    const kws = new Set();
    for (const r of allRows || rows || []) {
      const d = r?.data || {};
      const a = safeTrim(d.appflowid);
      if (a) flows.add(a);
      for (const k of Array.isArray(d.keywords) ? d.keywords : []) {
        const v = safeTrim(k);
        if (v) kws.add(v);
      }
    }
    const sortFn = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());
    return { flowids: [...flows].sort(sortFn), keywords: [...kws].sort(sortFn) };
  }, [allRows, rows]);

  const shareUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    if (queryPicks.flowids.length) params.set("flowids", queryPicks.flowids.join(","));
    if (queryPicks.keywords.length) params.set("keywords", queryPicks.keywords.join(","));
    const q = params.toString();
    return `${window.location.origin}${window.location.pathname}${q ? "?" + q : ""}`;
  }, [queryPicks]);

  React.useEffect(() => {
    if (!queryOpen) return;
    const params = new URLSearchParams();
    if (queryPicks.flowids.length) params.set("flowids", queryPicks.flowids.join(","));
    if (queryPicks.keywords.length) params.set("keywords", queryPicks.keywords.join(","));
    const q = params.toString();
    const next = `${window.location.pathname}${q ? "?" + q : ""}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState({}, "", next);
    }
  }, [queryOpen, queryPicks]);

  const openQueryPanel = () => {
    const p = new URLSearchParams(window.location.search);
    const list = (k) =>
      String(p.get(k) || "")
        .split(",")
        .map((x) => safeTrim(x))
        .filter(Boolean);
    setQueryPicks({ flowids: list("flowids"), keywords: list("keywords") });
    setCopyMsg("");
    setQueryOpen(true);
  };
  const [hiddenCols, setHiddenCols] = React.useState(() =>
    new Set(RULE_COLUMNS.filter((c) => c.defaultHidden).map((c) => c.key))
  );

  const selectableCols = RULE_COLUMNS.filter((c) => !c.fixed);
  const visibleCols = RULE_COLUMNS.filter((c) => c.fixed || !hiddenCols.has(c.key));

  const toggleCol = (key) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const actions = { onEdit, onEditYaml, onCopy, onDelete };

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">
          rules{isNonEmptyString(env) ? ` / ${env}` : ""} ({Array.isArray(rows) ? rows.length : 0})
          {isNonEmptyString(urlFilterNote) ? ` — ${urlFilterNote}` : ""}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={openQueryPanel}>
            query
          </button>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setColMenuOpen((v) => !v)}>
              show/hide columns
            </button>
            {colMenuOpen ? (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setColMenuOpen(false)}
                />
                <div
                  className="card"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    zIndex: 41,
                    padding: "8px 6px",
                    minWidth: 180,
                    whiteSpace: "nowrap",
                  }}
                >
                  {selectableCols.map((c) => (
                    <label
                      key={c.key}
                      style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 8px", cursor: "pointer", fontSize: 13 }}
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(c.key)}
                        onChange={() => toggleCol(c.key)}
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : null}
          </span>
          <button className="iconBtn iconBtn-primary" title="Add" onClick={onAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            {visibleCols.map((c) => (
              <th key={c.key} className="fwTableHeaderCell" style={{ width: c.width }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span>{c.label}</span>
                  {c.helpPath ? <HelpIconButton docPath={c.helpPath} title={c.label} /> : null}
                </div>
              </th>
            ))}
          </tr>
          <tr>
            {visibleCols.map((c) => (
              <th key={c.key}>
                {c.filterKey ? (
                  <input
                    className={`filterInput ${isNonEmptyString(filters[c.filterKey]) ? "filterInput-active" : ""}`}
                    placeholder={c.filterPlaceholder}
                    value={filters[c.filterKey]}
                    onChange={(e) => setFilters((p) => ({ ...p, [c.filterKey]: e.target.value }))}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r, idx) => {
            const key = `${safeTrim(r?.filename)}::${r?.idx ?? idx}`;
            const d = r?.data || {};
            return (
              <tr key={key}>
                {visibleCols.map((c) => React.cloneElement(c.render(r, d, actions), { key: c.key }))}
              </tr>
            );
          })}

          {(rows || []).length === 0 ? (
            <tr>
              <td colSpan={visibleCols.length} className="muted">No items</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {queryOpen ? (
        <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && setQueryOpen(false)}>
          <div className="modalCard" style={{ width: "min(900px, 96vw)" }}>
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>Prepare query URL</h3>
              <button className="btn" onClick={() => setQueryOpen(false)}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
                <input
                  type="radio"
                  name="rulesQueryMode"
                  checked={queryMode === "flowids"}
                  onChange={() => setQueryMode("flowids")}
                />
                query by flowid
              </label>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
                <input
                  type="radio"
                  name="rulesQueryMode"
                  checked={queryMode === "keywords"}
                  onChange={() => setQueryMode("keywords")}
                />
                query by keyword
              </label>
            </div>

            <div style={{ marginTop: 12, display: "flex" }}>
              {queryMode === "flowids" ? (
                <MultiSelectPicker
                  options={queryOptions.flowids}
                  values={queryPicks.flowids}
                  onChange={(vals) => setQueryPicks((p) => ({ ...p, flowids: vals }))}
                  placeholder="pick flowids..."
                />
              ) : (
                <MultiSelectPicker
                  options={queryOptions.keywords}
                  values={queryPicks.keywords}
                  onChange={(vals) => setQueryPicks((p) => ({ ...p, keywords: vals }))}
                  placeholder="pick keywords..."
                />
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>share URL</div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input className="input" style={{ flex: 1 }} value={shareUrl} readOnly onFocus={(e) => e.target.select()} />
                <button
                  className="btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopyMsg("copied");
                    } catch {
                      setCopyMsg("copy failed");
                    }
                    setTimeout(() => setCopyMsg(""), 2000);
                  }}
                >
                  copy
                </button>
                {copyMsg ? <span className="muted" style={{ fontSize: 12 }}>{copyMsg}</span> : null}
              </div>
            </div>

            <div className="modalActions">
              <button
                className="btn"
                onClick={() => {
                  setQueryPicks({ flowids: [], keywords: [] });
                  setCopyMsg("");
                }}
              >
                clear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
