function ClampCell({ text }) {
  const t = String(text || "");
  return (
    <div className="clamp2" title={t}>
      {t}
    </div>
  );
}

function ProductsTableView({
  rows,
  filters,
  setFilters,
  form,
  setForm,
  canSubmit,
  prefixError,
  envNames,
  onSave,
  onResetForm,
  onEdit,
  onOpenProduct,
  onDelete,
}) {
  const setField = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const onEntryKeyDown = (e) => {
    if (e.key !== "Enter" || e.repeat || !canSubmit) return;
    e.preventDefault();
    onSave();
  };

  return (
    <div className="card" style={{ padding: 12 }}>
      <TableFilterBar filters={filters} setFilters={setFilters} />
      <table className={tableFilterClass(filters)}>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ minWidth: 130 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Product</span>
                <HelpIconButton docPath="/static/help/product/name.html" title="Product" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Envs</span>
                <HelpIconButton docPath="/static/help/product/envs.html" title="Envs" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Description</span>
                <HelpIconButton docPath="/static/help/product/description.html" title="Description" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ minWidth: 170 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Components Prefix List</span>
                <HelpIconButton docPath="/static/help/product/components_prefix_list.html" title="Components Prefix List" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ minWidth: 170 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Components Exclude List</span>
                <HelpIconButton docPath="/static/help/product/components_exclude_list.html" title="Components Exclude List" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ minWidth: 140 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Include flowids</span>
                <HelpIconButton docPath="/static/help/product/include_flowids.html" title="Include flowids" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ minWidth: 140 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Exclude flowids</span>
                <HelpIconButton docPath="/static/help/product/exclude_flowids.html" title="Exclude flowids" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ minWidth: 96 }}>Actions</th>
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
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.includeFlowids) ? "filterInput-active" : ""}`}
                placeholder="Filter include flowids..."
                value={filters.includeFlowids}
                onChange={(e) => setFilters((p) => ({ ...p, includeFlowids: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.excludeFlowids) ? "filterInput-active" : ""}`}
                placeholder="Filter exclude flowids..."
                value={filters.excludeFlowids}
                onChange={(e) => setFilters((p) => ({ ...p, excludeFlowids: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td>
              <input
                className="filterInput"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: String(e.target.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "") }))}
                onKeyDown={onEntryKeyDown}
                placeholder="product"
              />
            </td>
            <td style={{ minWidth: 200 }}>
              <FloatingMultiSelect
                options={Array.isArray(envNames) ? envNames : []}
                values={Array.isArray(form.envs) ? form.envs : []}
                onChange={(next) => setForm((p) => ({ ...p, envs: next }))}
                placeholder={(envNames || []).length ? "Select envs..." : "No envs defined - add them in the Environments tab"}
                inputTestId="product-new-envs"
              />
            </td>
            <td>
              <input className="filterInput" value={form.description} onChange={(e) => setField("description", e.target.value)} onKeyDown={onEntryKeyDown} placeholder="description" />
            </td>
            <td>
              <input
                className="filterInput"
                style={prefixError ? { borderColor: "#dc3545" } : undefined}
                title={prefixError || ""}
                value={form.componentsPrefixListText}
                onChange={(e) => setField("componentsPrefixListText", e.target.value)}
                onKeyDown={onEntryKeyDown}
                placeholder="PREFIX1, PREFIX2"
              />
            </td>
            <td>
              <input className="filterInput" value={form.componentsExcludeListText} onChange={(e) => setField("componentsExcludeListText", e.target.value)} onKeyDown={onEntryKeyDown} placeholder="optional" />
            </td>
            <td>
              <input className="filterInput" value={form.includeFlowidsText} onChange={(e) => setField("includeFlowidsText", e.target.value)} onKeyDown={onEntryKeyDown} placeholder="optional" />
            </td>
            <td>
              <input className="filterInput" value={form.excludeFlowidsText} onChange={(e) => setField("excludeFlowidsText", e.target.value)} onKeyDown={onEntryKeyDown} placeholder="optional" />
            </td>
            <td>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="iconBtn iconBtn-primary" title={prefixError || "Add product"} disabled={!canSubmit} onClick={onSave}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button className="iconBtn" title="Clear" onClick={onResetForm}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
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
                  <ClampCell text={(Array.isArray(r?.envs) ? r.envs : []).join(", ")} />
                </td>
                <td>
                  <ClampCell text={safeTrim(r?.description)} />
                </td>
                <td>
                  <ClampCell text={(Array.isArray(r?.componentsPrefixList) ? r.componentsPrefixList : []).join(", ")} />
                </td>
                <td>
                  <ClampCell text={(Array.isArray(r?.componentsExcludeList) ? r.componentsExcludeList : []).join(", ")} />
                </td>
                <td>
                  <ClampCell text={(Array.isArray(r?.includeFlowids) ? r.includeFlowids : []).join(", ")} />
                </td>
                <td>
                  <ClampCell text={(Array.isArray(r?.excludeFlowids) ? r.excludeFlowids : []).join(", ")} />
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="iconBtn iconBtn-primary"
                      title="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof onEdit === "function") onEdit(r);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
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
              <td colSpan={8} className="muted">
                No items
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
