function RulesTableView({ env, rows, filters, setFilters, onCommit, onAdd, onEdit, onEditYaml, onCopy, onDelete }) {
  function renderList(xs) {
    return (Array.isArray(xs) ? xs : []).join(", ");
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">
          rules{isNonEmptyString(env) ? ` / ${env}` : ""} ({Array.isArray(rows) ? rows.length : 0})
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="iconBtn iconBtn-primary" title="Verify and commit" onClick={onCommit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" />
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 6v6" />
            </svg>
          </button>
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
            <th className="fwTableHeaderCell" style={{ width: 120 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>appflowid</span>
                <HelpIconButton docPath="/static/help/rules/appflowid.html" title="appflowid" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>source-list</span>
                <HelpIconButton docPath="/static/help/rules/source-list.html" title="source-list" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>destination-list</span>
                <HelpIconButton docPath="/static/help/rules/destination-list.html" title="destination-list" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>protocol-port-map</span>
                <HelpIconButton docPath="/static/help/rules/protocol-port-map.html" title="protocol-port-map" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 200 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>business purpose</span>
                <HelpIconButton docPath="/static/help/rules/business-purpose.html" title="business purpose" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>kws</span>
                <HelpIconButton docPath="/static/help/rules/kws.html" title="kws" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 120 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>IN-FW</span>
                <HelpIconButton docPath="/static/help/rules/in-fw.html" title="IN-FW" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 220 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>file</span>
                <HelpIconButton docPath="/static/help/rules/file.html" title="file" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 100 }}>Actions</th>
          </tr>
          <tr>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.appflowid) ? "filterInput-active" : ""}`}
                placeholder="Filter appflowid..."
                value={filters.appflowid}
                onChange={(e) => setFilters((p) => ({ ...p, appflowid: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.source) ? "filterInput-active" : ""}`}
                placeholder="Filter source-list..."
                value={filters.source}
                onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.destination) ? "filterInput-active" : ""}`}
                placeholder="Filter destination-list..."
                value={filters.destination}
                onChange={(e) => setFilters((p) => ({ ...p, destination: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.protocolPort) ? "filterInput-active" : ""}`}
                placeholder="Filter protocol-port-map..."
                value={filters.protocolPort}
                onChange={(e) => setFilters((p) => ({ ...p, protocolPort: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.businessPurpose) ? "filterInput-active" : ""}`}
                placeholder="Filter business purpose..."
                value={filters.businessPurpose}
                onChange={(e) => setFilters((p) => ({ ...p, businessPurpose: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.keywords) ? "filterInput-active" : ""}`}
                placeholder="Filter kws..."
                value={filters.keywords}
                onChange={(e) => setFilters((p) => ({ ...p, keywords: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.inFw) ? "filterInput-active" : ""}`}
                placeholder="Filter IN-FW..."
                value={filters.inFw}
                onChange={(e) => setFilters((p) => ({ ...p, inFw: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.filename) ? "filterInput-active" : ""}`}
                placeholder="Filter file..."
                value={filters.filename}
                onChange={(e) => setFilters((p) => ({ ...p, filename: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r, idx) => {
            const key = `${safeTrim(r?.filename)}::${r?.idx ?? idx}`;
            const d = r?.data || {};
            return (
              <tr key={key}>
                <td style={{ fontWeight: 650 }}>{safeTrim(d.appflowid)}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(Array.isArray(d["source-list"]) ? d["source-list"] : []).map((g, i) => (
                      <div key={i} style={{ padding: "4px 6px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)" }}>
                        {safeTrim(g)}
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(Array.isArray(d["destination-list"]) ? d["destination-list"] : []).map((g, i) => (
                      <div key={i} style={{ padding: "4px 6px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)" }}>
                        {safeTrim(g)}
                      </div>
                    ))}
                  </div>
                </td>
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
                <td className="muted"><div style={{ whiteSpace: "pre-line" }}>{safeTrim(d["business-purpose"]) || "empty"}</div></td>
                <td><div style={{ whiteSpace: "pre-line" }}>{renderList(d.keywords)}</div></td>
                <td className="muted">{safeTrim(d["IN-FW"]) || "empty"}</td>
                <td><div style={{ whiteSpace: "pre-line" }}>{safeTrim(r?.filename)}</div></td>
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
              </tr>
            );
          })}

          {(rows || []).length === 0 ? (
            <tr>
              <td colSpan={9} className="muted">No items</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
