function RulesTableView({ env, rows, filters, setFilters }) {
  function renderList(xs) {
    return (Array.isArray(xs) ? xs : []).join(", ");
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <TableFilterBar filters={filters} setFilters={setFilters} />
      <table className={tableFilterClass(filters)}>
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
                <span>protocol-port</span>
                <HelpIconButton docPath="/static/help/rules/protocol-port.html" title="protocol-port" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>keywords</span>
                <HelpIconButton docPath="/static/help/rules/keywords.html" title="keywords" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 220 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>file</span>
                <HelpIconButton docPath="/static/help/rules/file.html" title="file" />
              </div>
            </th>
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
                placeholder="Filter protocol-port..."
                value={filters.protocolPort}
                onChange={(e) => setFilters((p) => ({ ...p, protocolPort: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.keywords) ? "filterInput-active" : ""}`}
                placeholder="Filter keywords..."
                value={filters.keywords}
                onChange={(e) => setFilters((p) => ({ ...p, keywords: e.target.value }))}
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
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r, idx) => {
            const key = `${safeTrim(r?.filename)}::${r?.idx ?? idx}`;
            const d = r?.data || {};
            return (
              <tr key={key}>
                <td style={{ fontWeight: 650 }}>{safeTrim(d.appflowid)}</td>
                <td><div style={{ whiteSpace: "pre-line" }}>{renderList(d["source-list"])}</div></td>
                <td><div style={{ whiteSpace: "pre-line" }}>{renderList(d["destination-list"])}</div></td>
                <td><div style={{ whiteSpace: "pre-line" }}>{renderList(d["protocol-port"])}</div></td>
                <td><div style={{ whiteSpace: "pre-line" }}>{renderList(d.keywords)}</div></td>
                <td><div style={{ whiteSpace: "pre-line" }}>{safeTrim(r?.filename)}</div></td>
              </tr>
            );
          })}

          {(rows || []).length === 0 ? (
            <tr>
              <td colSpan={6} className="muted">No items</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
