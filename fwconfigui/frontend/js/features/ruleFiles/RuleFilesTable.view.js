function RuleFilesTableView({ rows, filters, setFilters, onAdd, onDelete, editingKey, setEditingKey, draft, setDraft, onSave }) {
  function normalizeFilename(v) {
    return String(v || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "");
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">rule-files ({Array.isArray(rows) ? rows.length : 0})</div>
        <button className="iconBtn iconBtn-primary" title="Add" onClick={onAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ width: 340 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Name</span>
                <HelpIconButton docPath="/static/help/rule-files/name.html" title="Name" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 100 }}>
              Actions
            </th>
          </tr>
          <tr>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.name) ? "filterInput-active" : ""}`}
                placeholder="Filter name..."
                value={filters.name}
                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {editingKey === "__new__" ? (
            <tr>
              <td>
                <input
                  className="input"
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: normalizeFilename(e.target.value) }))}
                  placeholder="e.g. fw-rules.yaml"
                />
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={onSave} disabled={!isNonEmptyString(draft.name)}>
                    Save
                  </button>
                  <button className="btn" onClick={() => setEditingKey("")}>Cancel</button>
                </div>
              </td>
            </tr>
          ) : null}

          {rows.map((r, idx) => (
            <tr key={`${r.filename}:${r.name || idx}`}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{safeTrim(r?.name)}</span>
                </div>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="iconBtn iconBtn-danger" title="Delete" onClick={() => onDelete(r)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {rows.length === 0 && editingKey !== "__new__" ? (
            <tr>
              <td colSpan={2} className="muted">
                No items
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
