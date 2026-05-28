function AddrsTableView({ env, rows, filters, setFilters, onAdd, onCheckUsed, onEdit, onDelete, onExclude, onExcludeEnvCommon, editingKey, draft, setDraft, canSubmit, onCancelEdit, onSave }) {
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
          {editingKey === "__new__" ? (
            <tr key="__new__">
              <td>
                <input
                  className="filterInput"
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: normalizeName(e.target.value) }))}
                  placeholder="name"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.value}
                  onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))}
                  placeholder="1.1.1.1 or 1.1.1.1-1.1.1.340 or 1.1.1.1/24"
                />
              </td>
              <td>
                <input className="filterInput" value={draft.nameOverride} onChange={(e) => setDraft((p) => ({ ...p, nameOverride: e.target.value }))} placeholder="optional" />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.inFirewall}
                  onChange={(e) => setDraft((p) => ({ ...p, inFirewall: e.target.value }))}
                  placeholder="empty/true/false"
                />
              </td>
              <td>
                <input
                  className="filterInput"
                  value={draft.filename}
                  onChange={(e) => setDraft((p) => ({ ...p, filename: normalizeFilename(e.target.value) }))}
                  placeholder="addresses.yaml"
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

          {rows.map((r, idx) =>
            (() => {
              const rowKey = `${safeTrim(r.filename) || "addresses.yaml"}::${r.name || idx}`;
              const isEditingRow = editingKey === rowKey;
              if (isEditingRow) {
                return (
                  <tr key={rowKey}>
                    <td>
                      <input
                        className="filterInput"
                        value={draft.name}
                        onChange={(e) => setDraft((p) => ({ ...p, name: normalizeName(e.target.value) }))}
                      />
                    </td>
                    <td>
                      <input className="filterInput" value={draft.value} onChange={(e) => setDraft((p) => ({ ...p, value: e.target.value }))} />
                    </td>
                    <td>
                      <input className="filterInput" value={draft.nameOverride} onChange={(e) => setDraft((p) => ({ ...p, nameOverride: e.target.value }))} />
                    </td>
                    <td>
                      <input className="filterInput" value={draft.inFirewall} onChange={(e) => setDraft((p) => ({ ...p, inFirewall: e.target.value }))} />
                    </td>
                    <td>
                      <input
                        className="filterInput"
                        value={draft.filename}
                        onChange={(e) => setDraft((p) => ({ ...p, filename: normalizeFilename(e.target.value) }))}
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
              const nameOverride = safeTrim(r?.data?.["name-override"]) || "empty";
              const inFirewall = (() => {
                const v = r?.data?.["in-firewall"];
                if (v === true) return "true";
                if (v === false) return "false";
                const s = safeTrim(v).toLowerCase();
                return s || "empty";
              })();
              const usedInGrp = (() => {
                const v = r?.data?.["used-in-grp"];
                if (v === true) return "true";
                if (v === false) return "false";
                const s = safeTrim(v).toLowerCase();
                return s || "empty";
              })();
              const usedInRule = (() => {
                const v = r?.data?.["used-in-rule"];
                if (v === true) return "true";
                if (v === false) return "false";
                const s = safeTrim(v).toLowerCase();
                return s || "empty";
              })();
              return (
                <tr key={`${safeTrim(r.filename) || "addresses.yaml"}::${r.name || idx}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <span>{r.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button className="iconBtn" title="Exclude from import" onClick={() => onExclude(r)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                        </button>
                        <button className="iconBtn" title="Exclude from env common" onClick={() => onExcludeEnvCommon(r)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <path d="M8 12h8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="muted">{safeTrim(r?.data?.ip) || safeTrim(r?.data?.range) || safeTrim(r?.data?.subnet)}</td>
                  <td className="muted">{nameOverride}</td>
                  <td className="muted">{inFirewall}</td>
                  <td className="muted">{usedInGrp}</td>
                  <td className="muted">{usedInRule}</td>
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
