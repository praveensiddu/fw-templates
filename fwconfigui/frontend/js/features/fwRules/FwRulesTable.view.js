function FwRulesTableView({
  rows,
  filters,
  setFilters,
  onAdd,
  onEdit,
  onEditYaml,
  onCopy,
  onDelete,
  onMoveFile,
  getRowKey,
  cellEdit,
  onStartCellEdit,
  onCancelCellEdit,
  onSaveCellEdit,
  setCellEdit,
  businessPurposeNames,
  keywordNames,
  envNames,
  portProtocolNames,
  ruleFileNames,
  MultiSelectPicker,
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">fw-templates ({Array.isArray(rows) ? rows.length : 0})</div>
        <button className="btn btn-primary" onClick={onAdd}>
          Add
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ width: 140 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>App Flow ID</span>
                <HelpIconButton docPath="/static/help/fw-rules/appflowid.html" title="App Flow ID" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 280 }}>Source List</th>
            <th className="fwTableHeaderCell" style={{ width: 280 }}>Destination List</th>
            <th className="fwTableHeaderCell" style={{ width: 220 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Protocol-Port</span>
                <HelpIconButton docPath="/static/help/fw-rules/protocol-port.html" title="Protocol-Port" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 180 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Business Purpose</span>
                <HelpIconButton docPath="/static/help/fw-rules/business-purpose.html" title="Business Purpose" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 35 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>KWS</span>
                <HelpIconButton docPath="/static/help/fw-rules/keywords.html" title="Keywords" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 35 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Envs</span>
                <HelpIconButton docPath="/static/help/fw-rules/envs.html" title="Envs" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 170 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>File</span>
                <HelpIconButton docPath="/static/help/fw-rules/file.html" title="File" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 100 }}>Actions</th>
          </tr>
          <tr>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.appflowid) ? "filterInput-active" : ""}`}
                placeholder="Filter appflowid..."
                value={filters.appflowid}
                onChange={(e) => setFilters((p) => ({ ...p, appflowid: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters["source-list"]) ? "filterInput-active" : ""}`}
                placeholder="Filter source..."
                value={filters["source-list"]}
                onChange={(e) => setFilters((p) => ({ ...p, "source-list": e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters["destination-list"]) ? "filterInput-active" : ""}`}
                placeholder="Filter destination..."
                value={filters["destination-list"]}
                onChange={(e) => setFilters((p) => ({ ...p, "destination-list": e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.ppref) ? "filterInput-active" : ""}`}
                placeholder="Filter protocol refs..."
                value={filters.ppref}
                onChange={(e) => setFilters((p) => ({ ...p, ppref: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.bp) ? "filterInput-active" : ""}`}
                placeholder="Filter business purpose..."
                value={filters.bp}
                onChange={(e) => setFilters((p) => ({ ...p, bp: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.keywords) ? "filterInput-active" : ""}`}
                placeholder="Filter keywords..."
                value={filters.keywords}
                onChange={(e) => setFilters((p) => ({ ...p, keywords: e.target.value }))}
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
                className={`filterInput ${isNonEmptyString(filters.filename) ? "filterInput-active" : ""}`}
                placeholder="Filter file..."
                value={filters.filename}
                onChange={(e) => setFilters((p) => ({ ...p, filename: e.target.value }))}
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
                const isEditing = (field) => !!rowKey && safeTrim(cellEdit?.key) === rowKey && safeTrim(cellEdit?.field) === field;
                return (
                  <>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span>{safeTrim(r?.data?.appflowid)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ whiteSpace: "pre-line" }}>{safeTrim(r.sourceDisplay)}</div>
                    </td>
                    <td>
                      <div style={{ whiteSpace: "pre-line" }}>{safeTrim(r.destinationDisplay)}</div>
                    </td>
                    <td>
                      {isEditing("protocol-port-reference") ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <MultiSelectPicker
                            options={Array.isArray(portProtocolNames) ? portProtocolNames : []}
                            values={Array.isArray(cellEdit?.protocolPortRefs) ? cellEdit.protocolPortRefs : []}
                            onChange={(next) => setCellEdit((p) => ({ ...p, protocolPortRefs: next }))}
                            placeholder="Add protocol-port ref..."
                            inputTestId={`fw-rule-cell-pprefs-${rowKey}`}
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
                          <div style={{ whiteSpace: "pre-line", flex: 1 }}>{safeTrim(r.protocolPortDisplay)}</div>
                          <button
                            className="iconBtn"
                            title="Edit"
                            onClick={() => onStartCellEdit(r, "protocol-port-reference")}
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
                      {isEditing("business-purpose-reference") ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <select
                            className="filterInput"
                            value={safeTrim(cellEdit?.businessPurpose)}
                            onChange={(e) => setCellEdit((p) => ({ ...p, businessPurpose: e.target.value }))}
                          >
                            <option value="">Select...</option>
                            {(Array.isArray(businessPurposeNames) ? businessPurposeNames : []).map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
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
                          <div style={{ flex: 1 }}>{safeTrim(r.businessPurposeDisplay)}</div>
                          <button
                            className="iconBtn"
                            title="Edit"
                            onClick={() => onStartCellEdit(r, "business-purpose-reference")}
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
                      {isEditing("keywords") ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <MultiSelectPicker
                            options={Array.isArray(keywordNames) ? keywordNames : []}
                            values={Array.isArray(cellEdit?.keywords) ? cellEdit.keywords : []}
                            onChange={(next) => setCellEdit((p) => ({ ...p, keywords: next }))}
                            placeholder="Add keyword..."
                            inputTestId={`fw-rule-cell-keywords-${rowKey}`}
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
                          <div style={{ whiteSpace: "pre-line", flex: 1 }}>{safeTrim(r.keywordsDisplay)}</div>
                          <button
                            className="iconBtn"
                            title="Edit"
                            onClick={() => onStartCellEdit(r, "keywords")}
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
                      {isEditing("envs") ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <MultiSelectPicker
                            options={Array.isArray(envNames) ? envNames : []}
                            values={Array.isArray(cellEdit?.envs) ? cellEdit.envs : []}
                            onChange={(next) => setCellEdit((p) => ({ ...p, envs: next }))}
                            placeholder="Add env..."
                            inputTestId={`fw-rule-cell-envs-${rowKey}`}
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
                          <div style={{ whiteSpace: "pre-line", flex: 1 }}>{safeTrim(r.envsJoined)}</div>
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
                      <select
                        className="filterInput"
                        value={safeTrim(r.filename)}
                        onChange={(e) => onMoveFile && onMoveFile(r, e.target.value)}
                      >
                        {(() => {
                          const current = safeTrim(r?.filename);
                          const options = Array.isArray(ruleFileNames) ? ruleFileNames : [];
                          const unique = [];
                          const seen = new Set();
                          for (const opt of [current, ...options]) {
                            const v = safeTrim(opt);
                            if (!v || seen.has(v)) continue;
                            seen.add(v);
                            unique.push(v);
                          }
                          return unique.map((fn) => (
                            <option key={fn} value={fn}>
                              {fn}
                            </option>
                          ));
                        })()}
                      </select>
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
              <td colSpan={9} className="muted">
                No items
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
