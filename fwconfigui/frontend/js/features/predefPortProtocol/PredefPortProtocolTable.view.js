function PredefPortProtocolTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onEdit,
  onCopy,
  onDelete,
  editingKey,
  draft,
  setDraft,
  canSubmit,
  onCancelEdit,
  onSave,
}) {
  function renderAliases(v) {
    const xs = Array.isArray(v) ? v : [];
    return xs.map((x) => safeTrim(x)).filter(Boolean).join(", ");
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <TableFilterBar filters={filters} setFilters={setFilters} />
      <table className={tableFilterClass(filters)}>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ width: 240 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Port-Protocol</span>
                <HelpIconButton docPath="/static/help/predef-port-protocol/name.html" title="Port-Protocol" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 280 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Aliases</span>
                <HelpIconButton docPath="/static/help/predef-port-protocol/aliases.html" title="Aliases" />
              </div>
            </th>
            <th className="fwTableHeaderCell">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Description</span>
                <HelpIconButton docPath="/static/help/predef-port-protocol/description.html" title="Description" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 140 }}>Actions</th>
          </tr>
          <tr>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.name) ? "filterInput-active" : ""}`}
                placeholder="Filter port-protocol..."
                value={filters.name}
                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.aliases) ? "filterInput-active" : ""}`}
                placeholder="Filter aliases..."
                value={filters.aliases}
                onChange={(e) => setFilters((p) => ({ ...p, aliases: e.target.value }))}
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
        {/* tfoot always renders below the list: the entry row for adding a new item */}
        <tfoot>
          {editingKey === "" || editingKey === "__new__" ? (
            <tr key="__new__">
              <td>
                <input
                  className="filterInput"
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: String(e.target.value || "").toUpperCase() }))}
                  placeholder="port-protocol"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.aliases}
                  onChange={(e) => setDraft((p) => ({ ...p, aliases: e.target.value }))}
                  placeholder="aliases (comma-separated)"
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
        </tfoot>
        <tbody>
          {(rows || []).map((r, idx) => (
            (() => {
              const rowKey = `${r.name || idx}`;
              const isEditingRow = editingKey === rowKey;
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
                        value={draft.aliases}
                        onChange={(e) => setDraft((p) => ({ ...p, aliases: e.target.value }))}
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
                <tr key={safeTrim(r?.name) || rowKey}>
                  <td style={{ fontWeight: 650 }}>{safeTrim(r?.name)}</td>
                  <td>
                    <div style={{ whiteSpace: "pre-line" }}>{renderAliases(r?.aliases)}</div>
                  </td>
                  <td>
                    <div style={{ whiteSpace: "pre-line" }}>{safeTrim(r?.description)}</div>
                  </td>
                  <td>
                    <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => onEdit(r)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
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
            })()
          ))}
          {(rows || []).length === 0 ? (
            <tr>
              <td colSpan={4} className="muted">
                No items
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
