function ProductsTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onOpenProduct,
  onDelete,
  onImport,
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
  function isEditingCell(row, field) {
    const key = safeTrim(row?.name);
    return safeTrim(cellEdit?.key) && safeTrim(cellEdit?.key) === key && safeTrim(cellEdit?.field) === safeTrim(field);
  }

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
            <th className="fwTableHeaderCell" style={{ width: 260 }}>
              Envs
            </th>
            <th className="fwTableHeaderCell">Description</th>
            <th className="fwTableHeaderCell" style={{ width: 300 }}>Components Prefix List</th>
            <th className="fwTableHeaderCell" style={{ width: 300 }}>Components Exclude List</th>
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
                className={`filterInput ${isNonEmptyString(filters.envs) ? "filterInput-active" : ""}`}
                placeholder="Filter envs..."
                value={filters.envs}
                onChange={(e) => setFilters((p) => ({ ...p, envs: e.target.value }))}
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
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.componentsPrefixList) ? "filterInput-active" : ""}`}
                placeholder="Filter prefix list..."
                value={filters.componentsPrefixList}
                onChange={(e) => setFilters((p) => ({ ...p, componentsPrefixList: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.componentsExcludeList) ? "filterInput-active" : ""}`}
                placeholder="Filter exclude list..."
                value={filters.componentsExcludeList}
                onChange={(e) => setFilters((p) => ({ ...p, componentsExcludeList: e.target.value }))}
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
                  placeholder="PRODUCT"
                />
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <MultiSelectPicker
                    options={Array.isArray(envNames) ? envNames : []}
                    values={Array.isArray(draft.envs) ? draft.envs : []}
                    onChange={(next) => setDraft((p) => ({ ...p, envs: next }))}
                    placeholder="Add env..."
                    inputTestId="products-draft-envs"
                    onEnter={onSave}
                  />
                  <button className="iconBtn iconBtn-primary" title="Save" disabled={!canSubmit} onClick={onSave} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button className="iconBtn" title="Cancel" onClick={onCancelEdit} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input
                    className="filterInput"
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    placeholder="description"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSave();
                      }
                    }}
                  />
                  <button className="iconBtn iconBtn-primary" title="Save" disabled={!canSubmit} onClick={onSave} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button className="iconBtn" title="Cancel" onClick={onCancelEdit} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input
                    className="filterInput"
                    value={draft.componentsPrefixListText}
                    onChange={(e) => setDraft((p) => ({ ...p, componentsPrefixListText: e.target.value }))}
                    placeholder="Reserved list the prefixs separated by comma. "
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSave();
                      }
                    }}
                  />
                  <button className="iconBtn iconBtn-primary" title="Save" disabled={!canSubmit} onClick={onSave} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button className="iconBtn" title="Cancel" onClick={onCancelEdit} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input
                    className="filterInput"
                    value={draft.componentsExcludeListText}
                    onChange={(e) => setDraft((p) => ({ ...p, componentsExcludeListText: e.target.value }))}
                    placeholder="Reserved list the prefixs separated by comma. "
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSave();
                      }
                    }}
                  />
                  <button className="iconBtn iconBtn-primary" title="Save" disabled={!canSubmit} onClick={onSave} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button className="iconBtn" title="Cancel" onClick={onCancelEdit} style={{ alignSelf: "flex-start" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </td>
              <td />
            </tr>
          ) : null}

          {(rows || []).map((r, idx) => {
            const rowKey = safeTrim(r?.name) || `${idx}`;
            return (
              <tr
                key={rowKey}
                onClick={(e) => {
                  const t = e?.target;
                  const btn = t && typeof t.closest === "function" ? t.closest("button") : null;
                  if (btn && !btn.hasAttribute("data-open-product")) return;
                  if (typeof onOpenProduct === "function") onOpenProduct(r);
                }}
                style={{ cursor: typeof onOpenProduct === "function" ? "pointer" : undefined }}
              >
                <td style={{ fontWeight: 650 }}>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: 0, border: "none", background: "transparent", fontWeight: 650, cursor: "pointer" }}
                    data-open-product
                    onClick={() => {
                      if (typeof onOpenProduct === "function") onOpenProduct(r);
                    }}
                  >
                    {safeTrim(r?.name)}
                  </button>
                </td>
                <td>
                  {isEditingCell(r, "envs") ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <MultiSelectPicker
                        options={Array.isArray(envNames) ? envNames : []}
                        values={Array.isArray(cellEdit?.envs) ? cellEdit.envs : []}
                        onChange={(next) => setCellEdit((p) => ({ ...(p || {}), envs: next }))}
                        placeholder="Add env..."
                        inputTestId={`products-cell-envs-${rowKey}`}
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
                      <div style={{ whiteSpace: "pre-line", flex: 1 }}>
                        {(Array.isArray(r?.envs) ? r.envs : []).join(", ")}
                      </div>
                      <button
                        className="iconBtn"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartCellEdit(r, "envs");
                        }}
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
                  {isEditingCell(r, "description") ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <input
                        className="filterInput"
                        value={safeTrim(cellEdit?.description)}
                        onChange={(e) => setCellEdit((p) => ({ ...(p || {}), description: e.target.value }))}
                        style={{ flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onSaveCellEdit();
                          }
                        }}
                        placeholder="description"
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
                      <div style={{ whiteSpace: "pre-line", flex: 1 }}>{safeTrim(r?.description)}</div>
                      <button
                        className="iconBtn"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartCellEdit(r, "description");
                        }}
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
                  {isEditingCell(r, "componentsPrefixListText") ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <input
                        className="filterInput"
                        value={safeTrim(cellEdit?.componentsPrefixListText)}
                        onChange={(e) => setCellEdit((p) => ({ ...(p || {}), componentsPrefixListText: e.target.value }))}
                        placeholder="Reserved list the prefixs separated by comma. "
                        style={{ flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onSaveCellEdit();
                          }
                        }}
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
                      <div style={{ whiteSpace: "pre-line", flex: 1 }}>
                        {(Array.isArray(r?.componentsPrefixList) ? r.componentsPrefixList : []).join(", ")}
                      </div>
                      <button
                        className="iconBtn"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartCellEdit(r, "componentsPrefixListText");
                        }}
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
                  {isEditingCell(r, "componentsExcludeListText") ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <input
                        className="filterInput"
                        value={safeTrim(cellEdit?.componentsExcludeListText)}
                        onChange={(e) => setCellEdit((p) => ({ ...(p || {}), componentsExcludeListText: e.target.value }))}
                        placeholder="Reserved list the prefixs separated by comma. "
                        style={{ flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            onSaveCellEdit();
                          }
                        }}
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
                      <div style={{ whiteSpace: "pre-line", flex: 1 }}>
                        {(Array.isArray(r?.componentsExcludeList) ? r.componentsExcludeList : []).join(", ")}
                      </div>
                      <button
                        className="iconBtn"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartCellEdit(r, "componentsExcludeListText");
                        }}
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
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="iconBtn"
                      title="Import"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImport(r);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button
                      className="iconBtn iconBtn-danger"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(r);
                      }}
                    >
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
              <td colSpan={6} className="muted">
                No items
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
