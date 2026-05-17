function ComponentsDetailsView({
  mode, // "add" | "edit"
  form,
  setForm,
  canSubmit,
  onBack,
  onSave,
  networkareaNames,
  siteNames,
  productNames,
  applyAllRule,
}) {
  const defaultEnvOptions = ["prd", "rtb", "pac", "ent", "dev"];
  const existingEnvOptions = (Array.isArray(form?.sitesItems) ? form.sitesItems : [])
    .map((x) => safeTrim(x?.env))
    .filter((x) => x && !defaultEnvOptions.includes(x));
  const envOptions = [...defaultEnvOptions, ...existingEnvOptions];

  function renderTitle() {
    return mode === "edit" ? "Edit component" : "Add component";
  }

  return (
    <div>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={onBack}>
          Back to components
        </button>
        <div className="muted">{renderTitle()}</div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" disabled={!canSubmit} onClick={onSave}>
          Save
        </button>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div className="fieldGrid">
          <div className="field">
            <div className="muted">Component name</div>
            <input className="input" value={safeTrim(form?.name)} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>

          <div className="field">
            <div className="muted">Networkarea</div>
            <select
              className="filterInput"
              value={safeTrim(form?.networkarea)}
              onChange={(e) => setForm((p) => ({ ...p, networkarea: e.target.value }))}
            >
              <option value="">(none)</option>
              {(Array.isArray(networkareaNames) ? networkareaNames : []).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Description</div>
            <input
              className="input"
              value={safeTrim(form?.description)}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Pick the products which are allowed to communicate with this component. Choose ALL if it is okay to expose it to all products.</div>
            <MultiSelectPicker
              options={Array.isArray(productNames) ? productNames : []}
              values={Array.isArray(form?.exposedto) ? form.exposedto : []}
              onChange={(next) => setForm((p) => ({ ...p, exposedto: applyAllRule(next) }))}
              placeholder="Pick products"
              inputTestId="components-exposedto"
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div className="muted">Sites in each env where this component runs</div>
              <button
                className="iconBtn iconBtn-primary"
                title="Add"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    sitesItems: [...(Array.isArray(p?.sitesItems) ? p.sitesItems : []), { env: "prd", sites: [] }],
                  }))
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
              {(Array.isArray(form?.sitesItems) ? form.sitesItems : []).length === 0 ? (
                <div className="muted">No sites</div>
              ) : null}

              {(Array.isArray(form?.sitesItems) ? form.sitesItems : []).map((it, idx) => (
                <div
                  key={`${safeTrim(it?.env) || "env"}-${idx}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 3fr auto",
                    gap: 12,
                    alignItems: "end",
                  }}
                >
                  <div className="field">
                    <div className="muted">Env</div>
                    <select
                      className="filterInput"
                      value={safeTrim(it?.env)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((p) => {
                          const next = Array.isArray(p?.sitesItems) ? [...p.sitesItems] : [];
                          next[idx] = { ...(next[idx] || {}), env: v };
                          return { ...p, sitesItems: next };
                        });
                      }}
                    >
                      {envOptions.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <div className="muted">Sites</div>
                    <MultiSelectPicker
                      options={Array.isArray(siteNames) ? siteNames : []}
                      values={Array.isArray(it?.sites) ? it.sites : []}
                      onChange={(nextSites) => {
                        setForm((p) => {
                          const next = Array.isArray(p?.sitesItems) ? [...p.sitesItems] : [];
                          next[idx] = { ...(next[idx] || {}), sites: nextSites };
                          return { ...p, sitesItems: next };
                        });
                      }}
                      placeholder="Pick sites"
                      inputTestId={`components-sites-${idx}`}
                    />
                  </div>

                  <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      className="iconBtn iconBtn-danger"
                      title="Remove"
                      onClick={() =>
                        setForm((p) => {
                          const next = Array.isArray(p?.sitesItems) ? [...p.sitesItems] : [];
                          next.splice(idx, 1);
                          return { ...p, sitesItems: next };
                        })
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
        </div>
      </div>
    </div>
  );
}
