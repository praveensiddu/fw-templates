function EnvTableView({
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
        <div className="muted">env yaml items</div>
        <button className="btn btn-primary" onClick={onAdd}>
          Add
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: 220 }}>File</th>
            <th style={{ width: 220 }}>Name</th>
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
                placeholder="Filter name..."
                value={filters.name}
                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.filename}:${r.name || idx}`}>
              <td>{r.filename}</td>
              <td>{r.name}</td>
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
              <td colSpan={3} className="muted">
                No items
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
