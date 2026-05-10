function ComponentsTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onEditName,
  onCopy,
  onDelete,
  cellEdit,
  setCellEdit,
  isEditingCell,
  onStartCellEdit,
  onCancelCellEdit,
  onSaveCellEdit,
  networkareaNames,
  siteNames,
}) {
  function renderList(v) {
    return (Array.isArray(v) ? v : []).join(", ");
  }

  function CellActions({ row, field }) {
    if (isEditingCell(row, field)) {
      return (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="iconBtn iconBtn-primary" title="Save" onClick={onSaveCellEdit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button className="iconBtn" title="Cancel" onClick={onCancelCellEdit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => onStartCellEdit(row, field)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">components ({Array.isArray(rows) ? rows.length : 0})</div>
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
            <th className="fwTableHeaderCell" style={{ width: 200 }}>Component</th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Networkarea</span>
                <HelpIconButton docPath="/static/help/components/networkarea.html" title="Networkarea" />
              </div>
            </th>
            <th className="fwTableHeaderCell">Description</th>
            <th className="fwTableHeaderCell" style={{ width: 220 }}>Exposedto</th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Sites PRD</span>
                <HelpIconButton docPath="/static/help/components/sites_prd.html" title="Sites PRD" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Sites PAC</span>
                <HelpIconButton docPath="/static/help/components/sites_pac.html" title="Sites PAC" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Sites RTB</span>
                <HelpIconButton docPath="/static/help/components/sites_rtb.html" title="Sites RTB" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Sites ENT</span>
                <HelpIconButton docPath="/static/help/components/sites_ent.html" title="Sites ENT" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Sites DEV</span>
                <HelpIconButton docPath="/static/help/components/sites_dev.html" title="Sites DEV" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 100 }}>Actions</th>
          </tr>
          <tr>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.componentname) ? "filterInput-active" : ""}`}
                placeholder="Filter component..."
                value={filters.componentname}
                onChange={(e) => setFilters((p) => ({ ...p, componentname: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.networkarea) ? "filterInput-active" : ""}`}
                placeholder="Filter networkarea..."
                value={filters.networkarea}
                onChange={(e) => setFilters((p) => ({ ...p, networkarea: e.target.value }))}
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
                className={`filterInput ${isNonEmptyString(filters.exposedto) ? "filterInput-active" : ""}`}
                placeholder="Filter exposedto..."
                value={filters.exposedto}
                onChange={(e) => setFilters((p) => ({ ...p, exposedto: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.sites_prd) ? "filterInput-active" : ""}`}
                placeholder="Filter sites..."
                value={filters.sites_prd}
                onChange={(e) => setFilters((p) => ({ ...p, sites_prd: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.sites_pac) ? "filterInput-active" : ""}`}
                placeholder="Filter sites..."
                value={filters.sites_pac}
                onChange={(e) => setFilters((p) => ({ ...p, sites_pac: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.sites_rtb) ? "filterInput-active" : ""}`}
                placeholder="Filter sites..."
                value={filters.sites_rtb}
                onChange={(e) => setFilters((p) => ({ ...p, sites_rtb: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.sites_ent) ? "filterInput-active" : ""}`}
                placeholder="Filter sites..."
                value={filters.sites_ent}
                onChange={(e) => setFilters((p) => ({ ...p, sites_ent: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.sites_dev) ? "filterInput-active" : ""}`}
                placeholder="Filter sites..."
                value={filters.sites_dev}
                onChange={(e) => setFilters((p) => ({ ...p, sites_dev: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const rowKey = `${r.componentname || idx}`;
            return (
              <tr key={rowKey}>
                <td>
                  <span style={{ fontWeight: 650 }}>{safeTrim(r.componentname)}</span>
                </td>

                <td>
                  {isEditingCell(r, "networkarea") ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select
                        className="filterInput"
                        value={safeTrim(cellEdit?.networkarea)}
                        onChange={(e) => setCellEdit((p) => ({ ...(p || {}), networkarea: e.target.value }))}
                        style={{ flex: 1 }}
                      >
                        <option value="">(none)</option>
                        {(networkareaNames || []).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <CellActions row={r} field="networkarea" />
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span>{safeTrim(r.networkarea)}</span>
                      <CellActions row={r} field="networkarea" />
                    </div>
                  )}
                </td>

                <td>
                  {isEditingCell(r, "description") ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        className="filterInput"
                        value={safeTrim(cellEdit?.description)}
                        onChange={(e) => setCellEdit((p) => ({ ...(p || {}), description: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                      <CellActions row={r} field="description" />
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span>{safeTrim(r.description)}</span>
                      <CellActions row={r} field="description" />
                    </div>
                  )}
                </td>

                <td>
                  {isEditingCell(r, "exposedto") ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        className="filterInput"
                        value={safeTrim(cellEdit?.exposedtoText)}
                        onChange={(e) => setCellEdit((p) => ({ ...(p || {}), exposedtoText: e.target.value }))}
                        style={{ flex: 1 }}
                        placeholder="app1, app2"
                      />
                      <CellActions row={r} field="exposedto" />
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span>{renderList(r.exposedto)}</span>
                      <CellActions row={r} field="exposedto" />
                    </div>
                  )}
                </td>

                {[
                  { key: "sites_prd", label: "sites_prd" },
                  { key: "sites_pac", label: "sites_pac" },
                  { key: "sites_rtb", label: "sites_rtb" },
                  { key: "sites_ent", label: "sites_ent" },
                  { key: "sites_dev", label: "sites_dev" },
                ].map((c) => (
                  <td key={c.key}>
                    {isEditingCell(r, c.key) ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <MultiSelectPicker
                            options={siteNames || []}
                            values={Array.isArray(cellEdit?.[c.key]) ? cellEdit[c.key] : []}
                            onChange={(vals) => setCellEdit((p) => ({ ...(p || {}), [c.key]: vals }))}
                            placeholder="Pick sites"
                          />
                        </div>
                        <CellActions row={r} field={c.key} />
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span>{renderList(r?.[c.key])}</span>
                        <CellActions row={r} field={c.key} />
                      </div>
                    )}
                  </td>
                ))}

                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => onEditName(r)}>
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
                  </div>
                </td>
              </tr>
            );
          })}

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
