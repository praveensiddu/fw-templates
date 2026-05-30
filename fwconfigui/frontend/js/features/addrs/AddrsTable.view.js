function AddrsTableView({ env, rows, filters, setFilters, onAdd, onCheckUsed, onShowUsedInGroups, onShowUsedInRules, usedInGrpModal, setUsedInGrpModal, usedInRuleModal, setUsedInRuleModal, onEdit, onDelete, onExclude, onExcludeEnvCommon, editingKey, draft, setDraft, canSubmit, onCancelEdit, onSave }) {
  function normalizeName(v) {
    return String(v || "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
  }

  function normalizeFilename(v) {
    const s = String(v || "").trim();
    return s || "addresses.yaml";
  }

  return (
    <div className="card" style={{ padding: 12 }}>
      {usedInGrpModal?.isOpen ? (
        <div
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setUsedInGrpModal({ isOpen: false, name: "", items: [], loading: false, error: "" });
          }}
        >
          <div style={{ background: "white", padding: 24, borderRadius: 12, width: "min(720px, calc(100vw - 32px))", maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2px solid #e9ecef", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#0d6efd" }}>{`Used in groups: ${safeTrim(usedInGrpModal?.name)}`}</h3>
              <button onClick={() => setUsedInGrpModal({ isOpen: false, name: "", items: [], loading: false, error: "" })} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: "#6c757d" }}>
                &times;
              </button>
            </div>

            {usedInGrpModal?.loading ? <div className="muted">Loading...</div> : null}
            {!usedInGrpModal?.loading && isNonEmptyString(safeTrim(usedInGrpModal?.error)) ? <div className="muted">{safeTrim(usedInGrpModal?.error)}</div> : null}
            {!usedInGrpModal?.loading && !isNonEmptyString(safeTrim(usedInGrpModal?.error)) ? (
              <pre className="muted" style={{ whiteSpace: "pre-wrap" }}>{(Array.isArray(usedInGrpModal?.items) ? usedInGrpModal.items : []).map((x) => safeTrim(x)).filter(Boolean).join("\n") || "(none)"}</pre>
            ) : null}
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button onClick={() => setUsedInGrpModal({ isOpen: false, name: "", items: [], loading: false, error: "" })} style={{ padding: "8px 16px", background: "#0d6efd", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {usedInRuleModal?.isOpen ? (
        <div
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setUsedInRuleModal({ isOpen: false, name: "", items: [], loading: false, error: "" });
          }}
        >
          <div style={{ background: "white", padding: 24, borderRadius: 12, width: "min(720px, calc(100vw - 32px))", maxHeight: "80vh", overflow: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2px solid #e9ecef", paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#0d6efd" }}>{`Used in rules: ${safeTrim(usedInRuleModal?.name)}`}</h3>
              <button onClick={() => setUsedInRuleModal({ isOpen: false, name: "", items: [], loading: false, error: "" })} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: "#6c757d" }}>
                &times;
              </button>
            </div>

            {usedInRuleModal?.loading ? <div className="muted">Loading...</div> : null}
            {!usedInRuleModal?.loading && isNonEmptyString(safeTrim(usedInRuleModal?.error)) ? <div className="muted">{safeTrim(usedInRuleModal?.error)}</div> : null}
            {!usedInRuleModal?.loading && !isNonEmptyString(safeTrim(usedInRuleModal?.error)) ? (
              <pre className="muted" style={{ whiteSpace: "pre-wrap" }}>{(Array.isArray(usedInRuleModal?.items) ? usedInRuleModal.items : []).map((x) => safeTrim(x)).filter(Boolean).join("\n") || "(none)"}</pre>
            ) : null}

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button onClick={() => setUsedInRuleModal({ isOpen: false, name: "", items: [], loading: false, error: "" })} style={{ padding: "8px 16px", background: "#0d6efd", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isNonEmptyString(editingKey) ? (
        <div
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.25)", zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancelEdit();
          }}
        >
          <div
            style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(520px, 96vw)", background: "white", boxShadow: "-4px 0 20px rgba(0,0,0,0.12)", padding: 16, overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const isNew = editingKey === "__new__";
              const currentRow = !isNew
                ? (rows || []).find((r) => `${safeTrim(r.filename) || "addresses.yaml"}::${r.name}` === editingKey)
                : null;
              const usedInGrpRaw = currentRow?.data?.["used-in-grp"];
              const usedInRuleRaw = currentRow?.data?.["used-in-rule"];
              const usedInGrpDisplay = usedInGrpRaw === null || usedInGrpRaw === undefined ? "empty" : String(usedInGrpRaw);
              const usedInRuleDisplay = usedInRuleRaw === null || usedInRuleRaw === undefined ? "empty" : String(usedInRuleRaw);

              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{isNew ? "Add address" : `Edit address: ${safeTrim(currentRow?.name)}`}</div>
                    <button type="button" className="iconBtn" title="Close" onClick={onCancelEdit}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div>
                      <div className="muted" style={{ marginBottom: 4 }}>name</div>
                      <input className="filterInput" autoFocus value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: normalizeName(e.target.value) }))} placeholder="name" />
                    </div>

                    <div>
                      <div className="muted" style={{ marginBottom: 4 }}>value</div>
                      <input className="filterInput" value={draft.value} onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))} placeholder="1.1.1.1 or 1.1.1.1-1.1.1.340 or 1.1.1.1/24" />
                    </div>

                    <div>
                      <div className="muted" style={{ marginBottom: 4 }}>name-override</div>
                      <textarea
                        className="filterInput"
                        value={String(draft.nameOverrideText || "")}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            nameOverrideText: String(e.target.value || ""),
                            nameOverride: String(e.target.value || "")
                              .split(/[\s,]+/)
                              .map((s) => safeTrim(s))
                              .filter(Boolean),
                          }))
                        }
                        placeholder="optional (comma or whitespace separated)"
                        rows={4}
                        style={{ resize: "vertical" }}
                      />
                    </div>

                    <div>
                      <div className="muted" style={{ marginBottom: 4 }}>file</div>
                      <input className="filterInput" value={draft.filename} onChange={(e) => setDraft((p) => ({ ...p, filename: normalizeFilename(e.target.value) }))} placeholder="addresses.yaml" />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                    <button type="button" className="iconBtn iconBtn-primary" title="Save" disabled={!canSubmit} onClick={onSave}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}

      <div className="actions">
        <div className="muted">
          addrs{isNonEmptyString(env) ? ` / ${env}` : ""} ({Array.isArray(rows) ? rows.length : 0})
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <button className="iconBtn" title="Check if used" onClick={onCheckUsed}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
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

      <table>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ width: 260 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>Name</span>
                <HelpIconButton docPath="/static/help/keywords/name.html" title="Name" />
              </div>
            </th>
            <th className="fwTableHeaderCell" style={{ width: 320 }}>value</th>
            <th className="fwTableHeaderCell" style={{ width: 220 }}>name-override</th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>in-firewall</th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>in-fw-grp</th>
            <th className="fwTableHeaderCell" style={{ width: 160 }}>in-fw-rule</th>
            <th className="fwTableHeaderCell" style={{ width: 200 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span>File</span>
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
                className={`filterInput ${isNonEmptyString(filters.value) ? "filterInput-active" : ""}`}
                placeholder="Filter value..."
                value={filters.value}
                onChange={(e) => setFilters((p) => ({ ...p, value: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.nameOverride) ? "filterInput-active" : ""}`}
                placeholder="Filter name-override..."
                value={filters.nameOverride}
                onChange={(e) => setFilters((p) => ({ ...p, nameOverride: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.inFirewall) ? "filterInput-active" : ""}`}
                placeholder="Filter in-firewall..."
                value={filters.inFirewall}
                onChange={(e) => setFilters((p) => ({ ...p, inFirewall: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.usedInGrp) ? "filterInput-active" : ""}`}
                placeholder="Filter used-in-grp..."
                value={filters.usedInGrp}
                onChange={(e) => setFilters((p) => ({ ...p, usedInGrp: e.target.value }))}
              />
            </th>
            <th>
              <input
                className={`filterInput ${isNonEmptyString(filters.usedInRule) ? "filterInput-active" : ""}`}
                placeholder="Filter used-in-rule..."
                value={filters.usedInRule}
                onChange={(e) => setFilters((p) => ({ ...p, usedInRule: e.target.value }))}
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
          {rows.map((r, idx) =>
            (() => {
              const rowKey = `${safeTrim(r.filename) || "addresses.yaml"}::${r.name || idx}`;
              const isFmExtract = safeTrim(r.filename) === "fm_extract_address.yaml";
              const nameOverrideDisplay = Array.isArray(r?.data?.["name-override"])
                ? r.data["name-override"].map((x) => safeTrim(x)).filter(Boolean).join("\n") || "empty"
                : "empty";
              const inFirewall = (() => {
                const v = r?.data?.["in-firewall"];
                if (v === true) return "true";
                if (v === false) return "false";
                const s = safeTrim(v).toLowerCase();
                return s || "empty";
              })();
              const usedInGrp = (() => {
                const v = r?.data?.["used-in-grp"];
                if (v === null || v === undefined) return "";
                const n = Number(v);
                if (!Number.isFinite(n) || n <= 0) return "";
                return String(n);
              })();
              const usedInRule = (() => {
                const v = r?.data?.["used-in-rule"];
                if (v === null || v === undefined) return "";
                const n = Number(v);
                if (!Number.isFinite(n) || n <= 0) return "";
                return String(n);
              })();
              return (
                <tr key={`${safeTrim(r.filename) || "addresses.yaml"}::${r.name || idx}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span>{r.name}</span>
                      {isFmExtract ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <button className="iconBtn iconBtn-danger" title="Exclude from import" onClick={() => onExclude(r)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                          </button>
                          <button className="iconBtn iconBtn-danger" title="Exclude from env common" onClick={() => onExcludeEnvCommon(r)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <path d="M8 12h8" />
                            </svg>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="muted">{safeTrim(r?.data?.ip) || safeTrim(r?.data?.range) || safeTrim(r?.data?.subnet)}</td>
                  <td className="muted" style={{ whiteSpace: "pre-line" }}>{nameOverrideDisplay}</td>
                  <td className="muted">{inFirewall}</td>
                  <td className="muted">
                    {isNonEmptyString(usedInGrp) ? (
                      <button
                        type="button"
                        title="Show groups"
                        onClick={() => onShowUsedInGroups(r)}
                        style={{ padding: 0, height: "auto", border: "none", background: "none", color: "#0d6efd", cursor: "pointer", textDecoration: "underline" }}
                      >
                        {usedInGrp}
                      </button>
                    ) : (
                      "empty"
                    )}
                  </td>
                  <td className="muted">
                    {isNonEmptyString(usedInRule) ? (
                      <button
                        type="button"
                        title="Show rules"
                        onClick={() => onShowUsedInRules(r)}
                        style={{ padding: 0, height: "auto", border: "none", background: "none", color: "#0d6efd", cursor: "pointer", textDecoration: "underline" }}
                      >
                        {usedInRule}
                      </button>
                    ) : (
                      "empty"
                    )}
                  </td>
                  <td className="muted">{safeTrim(r.filename) || "addresses.yaml"}</td>
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
            })()
          )}
          {rows.length === 0 ? (
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
