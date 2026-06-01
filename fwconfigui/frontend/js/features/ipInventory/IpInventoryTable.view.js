function IpInventoryTableView({ env, rows, filters, setFilters, onImport, isImporting, onOpenBulkUpload, bulkUpload, setBulkUpload, onCloseBulkUpload, onSubmitBulkUpload, onAdd, onEdit, onDelete, editingKey, draft, setDraft, canSubmit, onCancelEdit, onSave }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">
          ip_inventory{isNonEmptyString(env) ? ` / ${env}` : ""} ({Array.isArray(rows) ? rows.length : 0})
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="iconBtn"
            title={isImporting ? "Importing..." : "Import FortiMgr"}
            onClick={onImport}
            disabled={!!isImporting}
            style={isImporting ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="M8 11l4 4 4-4" />
              <path d="M4 21h16" />
            </svg>
          </button>
          <button className="iconBtn" title="Bulk upload" onClick={onOpenBulkUpload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
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

      {bulkUpload?.isOpen ? (
        <div
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.25)", zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseBulkUpload();
          }}
        >
          <div
            style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(640px, 96vw)", background: "white", boxShadow: "-4px 0 20px rgba(0,0,0,0.12)", padding: 16, overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Bulk upload</div>
              <button type="button" className="iconBtn" title="Close" onClick={onCloseBulkUpload}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <div className="muted" style={{ marginBottom: 4 }}>ipinventory</div>
                <textarea
                  className="filterInput"
                  rows={10}
                  style={{ resize: "vertical" }}
                  value={String(bulkUpload?.text || "")}
                  onChange={(e) => setBulkUpload((p) => ({ ...(p || {}), isOpen: true, text: String(e.target.value || "") }))}
                  placeholder="Paste IPs, ranges, or CIDRs. Comma or whitespace separated. Quotes will be stripped."
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" className="iconBtn iconBtn-primary" title="Save" onClick={onSubmitBulkUpload}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <table>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ width: 520 }}>ip</th>
            <th className="fwTableHeaderCell" style={{ width: 120 }}>Actions</th>
          </tr>
          <tr>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.name) ? "filterInput-active" : ""}`}
                placeholder="Filter ip..."
                value={filters.name}
                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
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
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder="1.1.1.1 or 1.1.1.1-1.1.1.2 or 1.1.1.0/24"
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

          {rows.map((r, idx) => {
            const rowKey = safeTrim(r?.name) || String(idx);
            const isEditingRow = editingKey === rowKey;

            if (isEditingRow) {
              return (
                <tr key={rowKey}>
                  <td>
                    <input className="filterInput" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
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
                <td className="muted">{safeTrim(r?.name)}</td>
                <td>
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
                </td>
              </tr>
            );
          })}

          {rows.length === 0 ? (
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
