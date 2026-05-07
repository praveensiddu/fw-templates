function FwRulesTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onEdit,
  onEditYaml,
  onCopy,
  onDelete,
  inlineEdit,
  getRowKey,
  onStartInlineEdit,
  onCancelInlineEdit,
  onSaveInlineEdit,
  setInlineEdit,
  businessPurposeNames,
  keywordNames,
  envNames,
  portProtocolNames,
  MultiSelectPicker,
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">fw-rules yaml items</div>
        <button className="btn btn-primary" onClick={onAdd}>
          Add
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: 220 }}>File</th>
            <th style={{ width: 140 }}>App Flow ID</th>
            <th style={{ width: 200 }}>Source List</th>
            <th style={{ width: 200 }}>Destination List</th>
            <th style={{ width: 220 }}>Protocol-Port</th>
            <th style={{ width: 180 }}>Business Purpose</th>
            <th style={{ width: 200 }}>Keywords</th>
            <th style={{ width: 220 }}>Envs</th>
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
                placeholder="Filter appflowid..."
                value={filters.appflowid}
                onChange={(e) => setFilters((p) => ({ ...p, appflowid: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter source..."
                value={filters["source-list"]}
                onChange={(e) => setFilters((p) => ({ ...p, "source-list": e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter destination..."
                value={filters["destination-list"]}
                onChange={(e) => setFilters((p) => ({ ...p, "destination-list": e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter protocol refs..."
                value={filters.ppref}
                onChange={(e) => setFilters((p) => ({ ...p, ppref: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter business purpose..."
                value={filters.bp}
                onChange={(e) => setFilters((p) => ({ ...p, bp: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter keywords..."
                value={filters.keywords}
                onChange={(e) => setFilters((p) => ({ ...p, keywords: e.target.value }))}
              />
            </th>
            <th>
              <input
                className="filterInput"
                placeholder="Filter envs..."
                value={filters.envs}
                onChange={(e) => setFilters((p) => ({ ...p, envs: e.target.value }))}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.filename}:${r.name || idx}`}>
              {(() => {
                const rowKey = typeof getRowKey === "function" ? getRowKey(r) : "";
                const isEditing = !!rowKey && safeTrim(inlineEdit?.key) === rowKey;
                return (
                  <>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            className="filterInput"
                            value={safeTrim(inlineEdit?.filename)}
                            onChange={(e) => setInlineEdit((p) => ({ ...p, filename: e.target.value }))}
                          />
                          <button className="iconBtn iconBtn-primary" title="Save" onClick={onSaveInlineEdit}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button className="iconBtn" title="Cancel" onClick={onCancelInlineEdit}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18" />
                              <path d="M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span>{r.filename}</span>
                          <button className="iconBtn" title="Edit file" onClick={() => onStartInlineEdit(r)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{safeTrim(r?.data?.appflowid)}</td>
                    <td>{safeTrim(r.sourceDisplay)}</td>
                    <td>{safeTrim(r.destinationDisplay)}</td>
                    <td>
                      {isEditing ? (
                        <MultiSelectPicker
                          options={Array.isArray(portProtocolNames) ? portProtocolNames : []}
                          values={Array.isArray(inlineEdit?.protocolPortRefs) ? inlineEdit.protocolPortRefs : []}
                          onChange={(next) => setInlineEdit((p) => ({ ...p, protocolPortRefs: next }))}
                          placeholder="Add protocol-port ref..."
                          inputTestId={`fw-rule-inline-pprefs-${rowKey}`}
                        />
                      ) : (
                        safeTrim(r.protocolPortDisplay)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="filterInput"
                          value={safeTrim(inlineEdit?.businessPurpose)}
                          onChange={(e) => setInlineEdit((p) => ({ ...p, businessPurpose: e.target.value }))}
                        >
                          <option value="">Select...</option>
                          {(Array.isArray(businessPurposeNames) ? businessPurposeNames : []).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      ) : (
                        safeTrim(r.businessPurposeDisplay)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <MultiSelectPicker
                          options={Array.isArray(keywordNames) ? keywordNames : []}
                          values={Array.isArray(inlineEdit?.keywords) ? inlineEdit.keywords : []}
                          onChange={(next) => setInlineEdit((p) => ({ ...p, keywords: next }))}
                          placeholder="Add keyword..."
                          inputTestId={`fw-rule-inline-keywords-${rowKey}`}
                        />
                      ) : (
                        safeTrim(r.keywordsDisplay)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <MultiSelectPicker
                          options={Array.isArray(envNames) ? envNames : []}
                          values={Array.isArray(inlineEdit?.envs) ? inlineEdit.envs : []}
                          onChange={(next) => setInlineEdit((p) => ({ ...p, envs: next }))}
                          placeholder="Add env..."
                          inputTestId={`fw-rule-inline-envs-${rowKey}`}
                        />
                      ) : (
                        Array.isArray(r?.data?.envs) ? r.data.envs.join(", ") : ""
                      )}
                    </td>
                    <td>
                      <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => onEdit(r)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                      <button className="iconBtn" title="Edit YAML" onClick={() => onEditYaml(r)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                          <path d="M10 9H8" />
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
                  </>
                );
              })()}
            </tr>
          ))}
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
