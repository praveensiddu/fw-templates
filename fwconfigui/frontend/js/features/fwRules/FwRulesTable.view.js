function FwRulesTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">fw-rules yaml items</div>
        <button className="btn btn-primary" onClick={onAdd}>
          Add
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: 220 }}>File</th>
            <th style={{ width: 140 }}>App Flow ID</th>
            <th style={{ width: 200 }}>Source</th>
            <th style={{ width: 200 }}>Destination</th>
            <th style={{ width: 220 }}>Protocol-Port Ref</th>
            <th style={{ width: 180 }}>Business Purpose</th>
            <th style={{ width: 200 }}>Keywords</th>
            <th style={{ width: 220 }}>Envs</th>
            <th style={{ width: 100 }}>Actions</th>
          </tr>
          <tr>
            <th>
              <input
                className="filterInput"
                placeholder="Filter file..."
                value={filters.filename}
                onChange={(e) => setFilters((p) => ({ ...p, filename: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter appflowid..."
                value={filters.appflowid}
                onChange={(e) => setFilters((p) => ({ ...p, appflowid: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter source..."
                value={filters.source}
                onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter destination..."
                value={filters.destination}
                onChange={(e) => setFilters((p) => ({ ...p, destination: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter protocol refs..."
                value={filters.ppref}
                onChange={(e) => setFilters((p) => ({ ...p, ppref: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter business purpose..."
                value={filters.bp}
                onChange={(e) => setFilters((p) => ({ ...p, bp: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter keywords..."
                value={filters.keywords}
                onChange={(e) => setFilters((p) => ({ ...p, keywords: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter envs..."
                value={filters.envs}
                onChange={(e) => setFilters((p) => ({ ...p, envs: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.filename}:${r.name || idx}`}>
              <td>{r.filename}</td>
              <td>{safeTrim(r?.data?.appflowid)}</td>
              <td>{safeTrim(r.sourceDisplay)}</td>
              <td>{safeTrim(r.destinationDisplay)}</td>
              <td>{Array.isArray(r?.data?.["protocol-port-reference"]) ? r.data["protocol-port-reference"].join(", ") : ""}</td>
              <td>{safeTrim(r?.data?.business_purpose)}</td>
              <td>{safeTrim(r.keywordsDisplay)}</td>
              <td>{Array.isArray(r?.data?.envs) ? r.data.envs.join(", ") : ""}</td>
              <td>
                <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => onEdit(r)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
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
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="muted">
                No items
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
