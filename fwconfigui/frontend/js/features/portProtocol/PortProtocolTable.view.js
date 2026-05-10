function PortProtocolTableView({
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
  function normalizePortProtocolName(v) {
    return String(v || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">port-protocol ({Array.isArray(rows) ? rows.length : 0})</div>
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
            <th className="fwTableHeaderCell" style={{ width: 220 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Name</span>
                <HelpIconButton docPath="/static/help/port-protocol/name.html" title="Name" />
              </div>
            </th>
            <th className="fwTableHeaderCell">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Port</span>
                <HelpIconButton docPath="/static/help/port-protocol/port.html" title="Port" />
              </div>
            </th>
            <th className="fwTableHeaderCell">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Service</span>
                <HelpIconButton docPath="/static/help/port-protocol/service.html" title="Service" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 100 }}>Actions</th>
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
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.port) ? "filterInput-active" : ""}`}
                placeholder="Filter port..."
                value={filters.port}
                onChange={(e) => setFilters((p) => ({ ...p, port: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.service) ? "filterInput-active" : ""}`}
                placeholder="Filter service..."
                value={filters.service}
                onChange={(e) => setFilters((p) => ({ ...p, service: e.target.value }))}
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
                  onChange={(e) => setDraft((p) => ({ ...p, name: normalizePortProtocolName(e.target.value) }))}
                  placeholder="name"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.port}
                  onChange={(e) => setDraft((p) => ({ ...p, port: e.target.value }))}
                  placeholder="port"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.service}
                  onChange={(e) => setDraft((p) => ({ ...p, service: e.target.value }))}
                  placeholder="service"
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

          {rows.map((r, idx) => (
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
                        onChange={(e) => setDraft((p) => ({ ...p, name: normalizePortProtocolName(e.target.value) }))}
                      />
                    </td>
                    <td>
                      <input
                        className="filterInput"
                        value={draft.port}
                        onChange={(e) => setDraft((p) => ({ ...p, port: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        className="filterInput"
                        value={draft.service}
                        onChange={(e) => setDraft((p) => ({ ...p, service: e.target.value }))}
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
                <tr key={`${r.filename}:${r.name || idx}`}>
                  <td>{r.name}</td>
                  <td>{safeTrim(r?.data?.["port-protocol"]?.port)}</td>
                  <td>{safeTrim(r?.data?.["port-protocol"]?.service)}</td>
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
              );
            })()
          ))}
          {rows.length === 0 ? (
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
