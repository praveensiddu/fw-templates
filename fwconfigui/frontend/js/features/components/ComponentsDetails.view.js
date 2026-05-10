function ComponentsDetailsView({
  mode, // "add" | "edit"
  form,
  setForm,
  canSubmit,
  onBack,
  onSave,
  networkareaNames,
  siteNames,
}) {
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
            <div className="muted">Exposedto (comma separated)</div>
            <input
              className="input"
              value={safeTrim(form?.exposedtoText)}
              onChange={(e) => setForm((p) => ({ ...p, exposedtoText: e.target.value }))}
              placeholder="app1, app2"
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Sites PRD</div>
            <MultiSelectPicker
              options={Array.isArray(siteNames) ? siteNames : []}
              values={Array.isArray(form?.sites_prd) ? form.sites_prd : []}
              onChange={(next) => setForm((p) => ({ ...p, sites_prd: next }))}
              placeholder="Pick sites"
              inputTestId="components-sites-prd"
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Sites PAC</div>
            <MultiSelectPicker
              options={Array.isArray(siteNames) ? siteNames : []}
              values={Array.isArray(form?.sites_pac) ? form.sites_pac : []}
              onChange={(next) => setForm((p) => ({ ...p, sites_pac: next }))}
              placeholder="Pick sites"
              inputTestId="components-sites-pac"
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Sites RTB</div>
            <MultiSelectPicker
              options={Array.isArray(siteNames) ? siteNames : []}
              values={Array.isArray(form?.sites_rtb) ? form.sites_rtb : []}
              onChange={(next) => setForm((p) => ({ ...p, sites_rtb: next }))}
              placeholder="Pick sites"
              inputTestId="components-sites-rtb"
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Sites ENT</div>
            <MultiSelectPicker
              options={Array.isArray(siteNames) ? siteNames : []}
              values={Array.isArray(form?.sites_ent) ? form.sites_ent : []}
              onChange={(next) => setForm((p) => ({ ...p, sites_ent: next }))}
              placeholder="Pick sites"
              inputTestId="components-sites-ent"
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <div className="muted">Sites DEV</div>
            <MultiSelectPicker
              options={Array.isArray(siteNames) ? siteNames : []}
              values={Array.isArray(form?.sites_dev) ? form.sites_dev : []}
              onChange={(next) => setForm((p) => ({ ...p, sites_dev: next }))}
              placeholder="Pick sites"
              inputTestId="components-sites-dev"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
