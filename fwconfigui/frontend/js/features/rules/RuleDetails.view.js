function RuleDetailsView({
  env,
  form,
  setForm,
  canSubmit,
  onBack,
  onSave,
  envNames,
  groupOptionsByEnv,
  onRequestEnvGroups,
  keywordNames,
}) {
  function matchesGroupPattern(value, pattern) {
    const v = safeTrim(value).toLowerCase();
    const pat = safeTrim(pattern).toLowerCase();
    if (!v) return false;
    if (!pat) return true;
    if (pat.includes("*")) {
      const re = new RegExp("^" + pat.split("*").map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
      return re.test(v);
    }
    return v.includes(pat);
  }

  const [sourceGroupFilter, setSourceGroupFilter] = React.useState("");
  const [destinationGroupFilter, setDestinationGroupFilter] = React.useState("");
  const [sourceEnv, setSourceEnv] = React.useState(safeTrim(env));
  const [destinationEnv, setDestinationEnv] = React.useState(safeTrim(env));

  const sourceGroups = Array.isArray(form?.sourceGroups) ? form.sourceGroups : [];
  const destinationGroups = Array.isArray(form?.destinationGroups) ? form.destinationGroups : [];
  const ppMap = Array.isArray(form?.ppMap) ? form.ppMap : [];
  const keywords = Array.isArray(form?.keywords) ? form.keywords : [];

  const sourceChoices = ((groupOptionsByEnv || {})[sourceEnv] || []).filter((o) =>
    matchesGroupPattern(o, sourceGroupFilter)
  );
  const destinationChoices = ((groupOptionsByEnv || {})[destinationEnv] || []).filter((o) =>
    matchesGroupPattern(o, destinationGroupFilter)
  );

  const envOptions = (Array.isArray(envNames) ? envNames : []).map((x) => safeTrim(x)).filter(Boolean);

  function setPpMapEntry(idx, patch) {
    setForm((p) => {
      const next = Array.isArray(p?.ppMap) ? [...p.ppMap] : [];
      next[idx] = { ...(next[idx] || {}), ...patch };
      return { ...p, ppMap: next };
    });
  }

  return (
    <div>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={onBack}>
          Back to rules
        </button>
        <div className="muted">
          {safeTrim(form?.mode) === "add" ? "Add rule" : "Edit rule"}
          {isNonEmptyString(env) ? ` / ${env}` : ""}
        </div>
      </div>

      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        Product : {safeTrim(getCurrentProduct()) || "unknown"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="card" style={{ padding: 12 }}>
          <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
            <div className="fwBlockHeaderLeft">
              <span className="fwBlockHeaderIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </span>
              <div className="fwBlockTitle">Core</div>
            </div>
            <div className="fwBlockActions">
              <HelpIconButton docPath="/static/help/rules/appflowid.html" title="Core" />
            </div>
          </div>
          <div className="fieldGrid">
            <div className="field">
              <div className="muted">Filename</div>
              <input
                className="input"
                value={safeTrim(form?.filename)}
                readOnly={safeTrim(form?.mode) !== "add"}
                onChange={(e) =>
                  setForm((p) => ({ ...p, filename: String(e.target.value || "").trim() }))
                }
              />
            </div>
            <div className="field">
              <div className="muted">App Flow ID</div>
              <input
                className="input"
                value={safeTrim(form?.appflowid)}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    appflowid: String(e.target.value || "").toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
            <div className="fwBlockHeaderLeft">
              <span className="fwBlockHeaderIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </span>
              <div className="fwBlockTitle">Source List</div>
            </div>
            <div className="fwBlockActions">
              <HelpIconButton docPath="/static/help/rules/source-list.html" title="Source List" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="fieldGrid">
              <div className="field">
                <div className="muted">show groups with this pattern</div>
                <input
                  className="filterInput"
                  value={sourceGroupFilter}
                  onChange={(e) => setSourceGroupFilter(e.target.value)}
                  placeholder="e.g. web or web-*"
                />
              </div>
              <div className="field">
                <div className="muted">env</div>
                <select
                  className="filterInput"
                  value={sourceEnv}
                  onChange={(e) => {
                    const v = safeTrim(e.target.value);
                    setSourceEnv(v);
                    if (typeof onRequestEnvGroups === "function") onRequestEnvGroups(v);
                  }}
                >
                  {envOptions.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <div className="muted">Groups</div>
              <MultiSelectPicker
                options={sourceChoices}
                values={sourceGroups}
                onChange={(next) => setForm((p) => ({ ...p, sourceGroups: next }))}
                placeholder="Add group..."
                inputTestId="rule-edit-source-groups"
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
            <div className="fwBlockHeaderLeft">
              <span className="fwBlockHeaderIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </span>
              <div className="fwBlockTitle">Destination List</div>
            </div>
            <div className="fwBlockActions">
              <HelpIconButton docPath="/static/help/rules/destination-list.html" title="Destination List" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="fieldGrid">
              <div className="field">
                <div className="muted">show groups with this pattern</div>
                <input
                  className="filterInput"
                  value={destinationGroupFilter}
                  onChange={(e) => setDestinationGroupFilter(e.target.value)}
                  placeholder="e.g. web or web-*"
                />
              </div>
              <div className="field">
                <div className="muted">env</div>
                <select
                  className="filterInput"
                  value={destinationEnv}
                  onChange={(e) => {
                    const v = safeTrim(e.target.value);
                    setDestinationEnv(v);
                    if (typeof onRequestEnvGroups === "function") onRequestEnvGroups(v);
                  }}
                >
                  {envOptions.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <div className="muted">Groups</div>
              <MultiSelectPicker
                options={destinationChoices}
                values={destinationGroups}
                onChange={(next) => setForm((p) => ({ ...p, destinationGroups: next }))}
                placeholder="Add group..."
                inputTestId="rule-edit-destination-groups"
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
            <div className="fwBlockHeaderLeft">
              <span className="fwBlockHeaderIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
                  <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
                </svg>
              </span>
              <div className="fwBlockTitle">Protocol-Port Map</div>
            </div>
            <div className="fwBlockActions">
              <HelpIconButton docPath="/static/help/rules/protocol-port-map.html" title="Protocol-Port Map" />
              <button
                className="iconBtn iconBtn-primary"
                title="Add"
                onClick={() => setForm((p) => ({ ...p, ppMap: [...(Array.isArray(p?.ppMap) ? p.ppMap : []), { "protocol-port": "", service_offered: "" }] }))}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ppMap.length === 0 ? <div className="muted">No protocol-port entries</div> : null}
            {ppMap.map((it, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
                <div className="field">
                  <div className="muted">protocol-port</div>
                  <input
                    className="input"
                    value={safeTrim(it?.["protocol-port"])}
                    onChange={(e) => setPpMapEntry(idx, { "protocol-port": e.target.value })}
                    placeholder="e.g. TCP-6443"
                  />
                </div>
                <div className="field">
                  <div className="muted">service_offered</div>
                  <input
                    className="input"
                    value={safeTrim(it?.service_offered)}
                    onChange={(e) => setPpMapEntry(idx, { service_offered: e.target.value })}
                    placeholder="e.g. apiserver"
                  />
                </div>
                <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    className="iconBtn iconBtn-danger"
                    title="Remove"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        ppMap: (Array.isArray(p?.ppMap) ? p.ppMap : []).filter((_, i) => i !== idx),
                      }))
                    }
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
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
            <div className="fwBlockHeaderLeft">
              <span className="fwBlockHeaderIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <path d="M7 12h10" />
                </svg>
              </span>
              <div className="fwBlockTitle">Business Purpose</div>
            </div>
            <div className="fwBlockActions">
              <HelpIconButton docPath="/static/help/rules/business-purpose.html" title="Business Purpose" />
            </div>
          </div>
          <div className="field">
            <input
              className="input"
              value={safeTrim(form?.businessPurpose)}
              onChange={(e) => setForm((p) => ({ ...p, businessPurpose: e.target.value }))}
              placeholder="business purpose text"
            />
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
            <div className="fwBlockHeaderLeft">
              <span className="fwBlockHeaderIcon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </span>
              <div className="fwBlockTitle">kws</div>
            </div>
            <div className="fwBlockActions">
              <HelpIconButton docPath="/static/help/rules/kws.html" title="kws" />
            </div>
          </div>
          <div className="field">
            <MultiSelectPicker
              options={Array.isArray(keywordNames) ? keywordNames : []}
              values={keywords}
              onChange={(next) => setForm((p) => ({ ...p, keywords: next }))}
              placeholder="Add keyword..."
              inputTestId="rule-edit-keywords"
            />
          </div>
        </div>
      </div>

      <div className="modalActions" style={{ marginTop: 16 }}>
        <button className="btn" onClick={onBack}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!canSubmit} onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
}
