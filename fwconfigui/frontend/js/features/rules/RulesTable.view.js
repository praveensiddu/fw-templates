function RulesTableView({ env, rows, filters, setFilters }) {
  function renderList(xs) {
    return (Array.isArray(xs) ? xs : []).join(", ");
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">
          rules{isNonEmptyString(env) ? ` / ${env}` : ""} ({Array.isArray(rows) ? rows.length : 0})
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ width: 120 }}>appflowid</th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>source-list</th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>destination-list</th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>protocol-port</th>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>keywords</th>
            <th className="fwTableHeaderCell" style={{ width: 220 }}>file</th>
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
