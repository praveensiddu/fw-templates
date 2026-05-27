function ProductsDetailsView({
  mode, // "add" | "edit"
  form,
  setForm,
  canSubmit,
  onBack,
  onSave,
  envNames,
}) {
  function normalizeProductName(v) {
    return String(v || "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9]/g, "");
  }

  const envOptions = Array.isArray(envNames) ? envNames : [];

  return (
    <div>
      <div className="actions" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={onBack}>
          Back to products
        </button>
        <div className="muted">{mode === "edit" ? "Edit" : "Add"} product</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: 12 }}>
            <div className="fieldGrid">
              <div className="field">
                <div className="muted">Product Name</div>
                <input
                  className="input"
                  value={safeTrim(form?.name)}
                  disabled={mode === "edit"}
                  onChange={(e) => setForm((p) => ({ ...p, name: normalizeProductName(e.target.value) }))}
                  placeholder="PRODUCT"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">Envs</div>
                <MultiSelectPicker
                  options={envOptions}
                  values={Array.isArray(form?.envs) ? form.envs : []}
                  onChange={(next) => setForm((p) => ({ ...p, envs: next }))}
                  placeholder="Add env..."
                  inputTestId="products-details-envs"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">Description</div>
                <input
                  className="input"
                  value={String(form?.description || "")}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="description"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">templates-repo</div>
                <input
                  className="input"
                  value={String(form?.templatesRepo || "")}
                  onChange={(e) => setForm((p) => ({ ...p, templatesRepo: e.target.value }))}
                  placeholder="org/repo (optional)"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">generated-repo</div>
                <input
                  className="input"
                  value={String(form?.generatedRepo || "")}
                  onChange={(e) => setForm((p) => ({ ...p, generatedRepo: e.target.value }))}
                  placeholder="repo name used under cloned-repositories (optional)"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">Components Prefix List (comma-separated)</div>
                <input
                  className="input"
                  value={String(form?.componentsPrefixListText || "")}
                  onChange={(e) => setForm((p) => ({ ...p, componentsPrefixListText: e.target.value }))}
                  placeholder="prefix1, prefix2"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">Components Exclude List (comma-separated)</div>
                <input
                  className="input"
                  value={String(form?.componentsExcludeListText || "")}
                  onChange={(e) => setForm((p) => ({ ...p, componentsExcludeListText: e.target.value }))}
                  placeholder="prefix1, prefix2"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">Include flowids (comma-separated)</div>
                <input
                  className="input"
                  value={String(form?.includeFlowidsText || "")}
                  onChange={(e) => setForm((p) => ({ ...p, includeFlowidsText: e.target.value }))}
                  placeholder="FLOWID1, FLOWID2"
                />
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <div className="muted">Exclude flowids (comma-separated)</div>
                <input
                  className="input"
                  value={String(form?.excludeFlowidsText || "")}
                  onChange={(e) => setForm((p) => ({ ...p, excludeFlowidsText: e.target.value }))}
                  placeholder="FLOWID1, FLOWID2"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 12 }}>
            <div className="actions" style={{ marginTop: 0, justifyContent: "space-between" }}>
              <div className="muted">Actions</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn btn-primary" disabled={!canSubmit} onClick={onSave}>
                Save
              </button>
              {!canSubmit ? (
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
                  Fill required fields to enable Save: name, envs, description, components prefix list.
                </div>
              ) : null}
              <button className="btn" onClick={onBack}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
