function NetworkAreasTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onDelete,
  editingKey,
  draft,
  setDraft,
  canSubmit,
  onCancelEdit,
  onSave,
  envNames,
  cellEdit,
  setCellEdit,
  onStartCellEdit,
  onCancelCellEdit,
  onSaveCellEdit,
}) {
  function renderEnvs(v) {
    const xs = Array.isArray(v) ? v : [];
    return xs.map((x) => safeTrim(x)).filter(Boolean).join(", ");
  }

  function isEditingEnvs(row) {
    const key = safeTrim(row?.name);
    return safeTrim(cellEdit?.key) && safeTrim(cellEdit?.key) === key && safeTrim(cellEdit?.field) === "envs";
  }

  function isEditingShortname(row) {
    const key = safeTrim(row?.name);
    return safeTrim(cellEdit?.key) && safeTrim(cellEdit?.key) === key && safeTrim(cellEdit?.field) === "shortname";
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">networkareas ({Array.isArray(rows) ? rows.length : 0})</div>
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
            <th className="fwTableHeaderCell" style={{ width: 240 }}>
              Name
            </th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              Shortname
            </th>
            <th className="fwTableHeaderCell">
              Envs
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
                className={`filterInput ${isNonEmptyString(filters.shortname) ? "filterInput-active" : ""}`}
                placeholder="Filter shortname..."
                value={filters.shortname}
                onChange={(e) => setFilters((p) => ({ ...p, shortname: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.envs) ? "filterInput-active" : ""}`}
                placeholder="Filter envs..."
                value={filters.envs}
                onChange={(e) => setFilters((p) => ({ ...p, envs: e.target.value }))}
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
                  onChange={(e) => setDraft((p) => ({ ...p, name: String(e.target.value || "").toUpperCase() }))}
                  placeholder="name"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.shortname}
                  onChange={(e) => setDraft((p) => ({ ...p, shortname: String(e.target.value || "").toUpperCase() }))}
                  placeholder="shortname"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.envs}
                  onChange={(e) => setDraft((p) => ({ ...p, envs: e.target.value }))}
                  placeholder="envs (comma-separated)"
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
                        value={draft.shortname}
                        onChange={(e) => setDraft((p) => ({ ...p, shortname: String(e.target.value || "").toUpperCase() }))}
                      />
                    </td>
                    <td>
                      <input
                        className="filterInput"
                        value={draft.envs}
                        onChange={(e) => setDraft((p) => ({ ...p, envs: e.target.value }))}
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
                    {isEditingShortname(r) ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <input
                          className="filterInput"
                          value={safeTrim(cellEdit?.shortname)}
                          onChange={(e) => setCellEdit((p) => ({ ...(p || {}), shortname: String(e.target.value || "").toUpperCase() }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              onSaveCellEdit();
                            }
                          }}
                          placeholder="shortname"
                          style={{ flex: 1 }}
                        />
                        <button className="iconBtn iconBtn-primary" title="Save" onClick={onSaveCellEdit} style={{ alignSelf: "flex-start" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button className="iconBtn" title="Cancel" onClick={onCancelCellEdit} style={{ alignSelf: "flex-start" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ whiteSpace: "pre-line", flex: 1 }}>{safeTrim(r?.shortname)}</div>
                        <button
                          className="iconBtn"
                          title="Edit"
                          onClick={() => onStartCellEdit(r, "shortname")}
                          style={{ alignSelf: "flex-start" }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditingEnvs(r) ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <MultiSelectPicker
                          options={Array.isArray(envNames) ? envNames : []}
                          values={Array.isArray(cellEdit?.envs) ? cellEdit.envs : []}
                          onChange={(next) => setCellEdit((p) => ({ ...(p || {}), envs: next }))}
                          placeholder="Add env..."
                          inputTestId={`networkarea-cell-envs-${rowKey}`}
                          onEnter={onSaveCellEdit}
                        />
                        <button className="iconBtn iconBtn-primary" title="Save" onClick={onSaveCellEdit} style={{ alignSelf: "flex-start" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button className="iconBtn" title="Cancel" onClick={onCancelCellEdit} style={{ alignSelf: "flex-start" }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ whiteSpace: "pre-line", flex: 1 }}>{renderEnvs(r?.envs)}</div>
                        <button
                          className="iconBtn"
                          title="Edit"
                          onClick={() => onStartCellEdit(r, "envs")}
                          style={{ alignSelf: "flex-start" }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
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
