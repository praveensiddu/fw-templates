function ProductsTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onEdit,
  onDelete,
  editingKey,
  draft,
  setDraft,
  canSubmit,
  onCancelEdit,
  onSave,
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">products ({Array.isArray(rows) ? rows.length : 0})</div>
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
            <th className="fwTableHeaderCell" style={{ width: 260 }}>
              Product
            </th>
            <th className="fwTableHeaderCell">Description</th>
            <th className="fwTableHeaderCell" style={{ width: 120 }}>Actions</th>
          </tr>
          <tr>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.name) ? "filterInput-active" : ""}`}
                placeholder="Filter product..."
                value={filters.name}
                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.description) ? "filterInput-active" : ""}`}
                placeholder="Filter description..."
                value={filters.description}
                onChange={(e) => setFilters((p) => ({ ...p, description: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {editingKey === "__new__" ? (
            <tr key="__new__">
              <td>
                <input
                  className="filterInput"
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: String(e.target.value || "").toUpperCase() }))}
                  placeholder="PRODUCT"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.description}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="description"
                />
              </td>
              <td>
                <button className="iconBtn iconBtn-primary" title="Save" disabled={!canSubmit} onClick={onSave}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button className="iconBtn" title="Cancel" onClick={onCancelEdit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </td>
            </tr>
          ) : null}

          {(rows || []).map((r, idx) => {
            const rowKey = safeTrim(r?.name) || `${idx}`;
            const isEditingRow = safeTrim(editingKey) === safeTrim(rowKey);

            if (isEditingRow) {
              return (
                <tr key={rowKey}>
                  <td>
                    <input
                      className="filterInput"
                      value={draft.name}
                      onChange={(e) => setDraft((p) => ({ ...p, name: String(e.target.value || "").toUpperCase() }))}
                    />
                  </td>
                  <td>
                    <input
                      className="filterInput"
                      value={draft.description}
                      onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    />
                  </td>
                  <td>
                    <button className="iconBtn iconBtn-primary" title="Save" disabled={!canSubmit} onClick={onSave}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button className="iconBtn" title="Cancel" onClick={onCancelEdit}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={rowKey}>
                <td style={{ fontWeight: 650 }}>{safeTrim(r?.name)}</td>
                <td>{safeTrim(r?.description)}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="iconBtn" title="Edit" onClick={() => onEdit(r)}>
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
                  </div>
                </td>
              </tr>
            );
          })}

          {(rows || []).length === 0 ? (
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
