function FwRuleDetailsView({
  mode, // "add" | "edit"
  form,
  setForm,
  canSubmit,
  onBack,
  onSave,
  isEditingSource,
  setIsEditingSource,
  isEditingDestination,
  setIsEditingDestination,
  onDiscardSourceEdits,
  onSubmitSourceEdits,
  onAddSourceItem,
  onRemoveSourceItem,
  onDiscardDestinationEdits,
  onSubmitDestinationEdits,
  onAddDestinationItem,
  onRemoveDestinationItem,
  endpointEnvOptions,
  envNames,
  keywordNames,
  portProtocolNames,
  businessPurposeNames,
}) {
  const sourceItems = Array.isArray(form?.sourceItems) ? form.sourceItems : [];
  const destinationItems = Array.isArray(form?.destinationItems) ? form.destinationItems : [];

  return (
    <div>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={onBack}>
          Back to rule-list
        </button>
        <div className="muted">{mode === "edit" ? "Edit" : "Add"} fw-rule</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 20, alignItems: "start" }}>
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
              <div className="fwBlockActions" />
            </div>
            <div className="fieldGrid">
              <div className="field">
                <div className="muted">File</div>
                <input
                  className="input"
                  value={form.filename}
                  onChange={(e) => setForm((p) => ({ ...p, filename: e.target.value }))}
                />
              </div>
              <div className="field">
                <div className="muted">App Flow ID</div>
                <input
                  className="input"
                  value={form.appflowid}
                  onChange={(e) => setForm((p) => ({ ...p, appflowid: e.target.value }))}
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
                {isEditingSource ? (
                  <>
                    <button className="iconBtn" title="Discard edits" onClick={onDiscardSourceEdits}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                    <button className="iconBtn iconBtn-primary" title="Submit" onClick={onSubmitSourceEdits}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button className="iconBtn" title="Add" onClick={onAddSourceItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => setIsEditingSource(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {isEditingSource ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sourceItems.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr auto",
                      gap: 12,
                      alignItems: "end",
                    }}
                  >
                    <div className="field">
                      <div className="muted">Group</div>
                      <input
                        className="input"
                        value={safeTrim(it?.group)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((p) => {
                            const next = Array.isArray(p?.sourceItems) ? [...p.sourceItems] : [];
                            next[idx] = { ...(next[idx] || {}), group: v };
                            return { ...p, sourceItems: next };
                          });
                        }}
                      />
                    </div>
                    <div className="field">
                      <div className="muted">Envs</div>
                      <MultiSelectPicker
                        options={endpointEnvOptions}
                        values={Array.isArray(it?.envs) ? it.envs : []}
                        onChange={(nextEnvs) => {
                          setForm((p) => {
                            const next = Array.isArray(p?.sourceItems) ? [...p.sourceItems] : [];
                            next[idx] = { ...(next[idx] || {}), envs: nextEnvs };
                            return { ...p, sourceItems: next };
                          });
                        }}
                        placeholder="Add env..."
                        inputTestId={`fw-rule-edit-source-envs-${idx}`}
                      />
                    </div>
                    <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                      <button className="iconBtn iconBtn-danger" title="Remove" onClick={() => onRemoveSourceItem(idx)}>
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
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sourceItems.length === 0 ? <div className="muted">No source endpoints</div> : null}
                {sourceItems.map((it, idx) => (
                  <div key={idx} className="muted">
                    {safeTrim(it?.group) || "(no group)"} [{Array.isArray(it?.envs) ? it.envs.join(", ") : ""}]
                  </div>
                ))}
              </div>
            )}
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
                {isEditingDestination ? (
                  <>
                    <button className="iconBtn" title="Discard edits" onClick={onDiscardDestinationEdits}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18" />
                        <path d="M6 6l12 12" />
                      </svg>
                    </button>
                    <button className="iconBtn iconBtn-primary" title="Submit" onClick={onSubmitDestinationEdits}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button className="iconBtn" title="Add" onClick={onAddDestinationItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button className="iconBtn iconBtn-primary" title="Edit" onClick={() => setIsEditingDestination(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {isEditingDestination ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {destinationItems.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr auto",
                      gap: 12,
                      alignItems: "end",
                    }}
                  >
                    <div className="field">
                      <div className="muted">Group</div>
                      <input
                        className="input"
                        value={safeTrim(it?.group)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((p) => {
                            const next = Array.isArray(p?.destinationItems) ? [...p.destinationItems] : [];
                            next[idx] = { ...(next[idx] || {}), group: v };
                            return { ...p, destinationItems: next };
                          });
                        }}
                      />
                    </div>
                    <div className="field">
                      <div className="muted">Envs</div>
                      <MultiSelectPicker
                        options={endpointEnvOptions}
                        values={Array.isArray(it?.envs) ? it.envs : []}
                        onChange={(nextEnvs) => {
                          setForm((p) => {
                            const next = Array.isArray(p?.destinationItems) ? [...p.destinationItems] : [];
                            next[idx] = { ...(next[idx] || {}), envs: nextEnvs };
                            return { ...p, destinationItems: next };
                          });
                        }}
                        placeholder="Add env..."
                        inputTestId={`fw-rule-edit-destination-envs-${idx}`}
                      />
                    </div>
                    <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                      <button className="iconBtn iconBtn-danger" title="Remove" onClick={() => onRemoveDestinationItem(idx)}>
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
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {destinationItems.length === 0 ? <div className="muted">No destination endpoints</div> : null}
                {destinationItems.map((it, idx) => (
                  <div key={idx} className="muted">
                    {safeTrim(it?.group) || "(no group)"} [{Array.isArray(it?.envs) ? it.envs.join(", ") : ""}]
                  </div>
                ))}
              </div>
            )}
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
                <div className="fwBlockTitle">Protocol-Port References</div>
              </div>
              <div className="fwBlockActions" />
            </div>
            <div className="fieldGrid">
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <MultiSelectPicker
                  options={portProtocolNames}
                  values={Array.isArray(form.protocolPortRefs) ? form.protocolPortRefs : []}
                  onChange={(next) => setForm((p) => ({ ...p, protocolPortRefs: next }))}
                  placeholder="Add protocol-port ref..."
                  inputTestId="fw-rule-edit-protocol-port-refs"
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
              <div className="fwBlockHeaderLeft">
                <span className="fwBlockHeaderIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
                    <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
                    <path d="M12 12v.01" />
                  </svg>
                </span>
                <div className="fwBlockTitle">Metadata</div>
              </div>
              <div className="fwBlockActions" />
            </div>
            <div className="fieldGrid">
              <div className="field">
                <div className="muted">Business Purpose</div>
                <select
                  className="filterInput"
                  value={safeTrim(form.businessPurpose)}
                  onChange={(e) => setForm((p) => ({ ...p, businessPurpose: e.target.value }))}
                >
                  <option value="">Select...</option>
                  {businessPurposeNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <div className="muted">Keywords</div>
                <MultiSelectPicker
                  options={keywordNames}
                  values={Array.isArray(form.keywords) ? form.keywords : []}
                  onChange={(next) => setForm((p) => ({ ...p, keywords: next }))}
                  placeholder="Add keyword..."
                  inputTestId="fw-rule-edit-keywords"
                />
              </div>
              <div className="field">
                <div className="muted">Envs</div>
                <MultiSelectPicker
                  options={envNames}
                  values={Array.isArray(form.envs) ? form.envs : []}
                  onChange={(next) => setForm((p) => ({ ...p, envs: next }))}
                  placeholder="Add env..."
                  inputTestId="fw-rule-edit-envs"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 12 }}>
            <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
              <div className="fwBlockHeaderLeft">
                <span className="fwBlockHeaderIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  </svg>
                </span>
                <div className="fwBlockTitle">Actions</div>
              </div>
              <div className="fwBlockActions" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn btn-primary" disabled={!canSubmit} onClick={onSave}>
                Save
              </button>
              <button className="btn" onClick={onBack}>
                Cancel
              </button>
            </div>
          </div>

          <div style={{ height: 16 }} />

          <div className="card" style={{ padding: 12 }}>
            <div className="fwBlockHeader" style={{ margin: -12, marginBottom: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
              <div className="fwBlockHeaderLeft">
                <span className="fwBlockHeaderIcon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </span>
                <div className="fwBlockTitle">Notes</div>
              </div>
              <div className="fwBlockActions" />
            </div>
            <div className="muted">App Flow ID and File are required to save.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
