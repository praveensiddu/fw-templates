/**
 * HomeView - presentation for the Home tab.
 *
 * Renders the tool purpose title and workspace/git repository settings fields.
 */
function HomeView({
  form,
  busy,
  savedMsg,
  canSave,
  onChange,
  onUseSamples,
  onSave,
}) {
  const fields = [
    {
      key: "WORKSPACE",
      title: "WORKSPACE",
      description: "Local folder used as workspace. Tool creates a subfolder by name fwconfigfiles under this workspace.",
    },
    {
      key: "TEMPLATES_GITREPO_GROUP",
      title: "TEMPLATES_GITREPO_GROUP",
      description: "Git project/group/org with one repo for each product to store templates.",
    },
    {
      key: "RENDERED_GITREPO_GROUP",
      title: "RENDERED_GITREPO_GROUP",
      description: "Git project/group/org with one repo for each product to store rendered configs.",
    },
    {
      key: "RENDERED_FOLDER_PREFIX",
      title: "RENDERED_FOLDER_PREFIX",
      description: "Folder prefix under each product's rendered repo where generated configs are written.",
    },
    {
      key: "INFRA_REPO",
      title: "INFRA_REPO",
      description: "Git repo which contains infrastructure data",
    },
  ];

  return (
    <div className="card" style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0, marginBottom: 6 }}>FW Config UI - workspace and repository setup</h3>
      <div className="muted" style={{ marginBottom: 16 }}>
        Self-service tool for managing firewall rule templates per product. Template repos are cloned
        from git into the local workspace, edited here, and rendered configs are pushed to the rendered
        repos.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {fields.map((f) => (
          <div key={f.key}>
            <div style={{ fontWeight: 650, marginBottom: 6 }}>{f.title}</div>
            <input
              className="input"
              value={String(form?.[f.key] || "")}
              onChange={(e) => onChange(f.key, e.target.value)}
              data-testid={`home-input-${f.key.toLowerCase()}`}
            />
            <div className="muted" style={{ marginTop: 6 }}>{f.description}</div>
          </div>
        ))}
      </div>

      <div className="actions" style={{ justifyContent: "flex-end", marginTop: 16 }}>
        {savedMsg ? <span className="muted" style={{ marginRight: "auto" }}>{savedMsg}</span> : null}
        <button className="btn" onClick={onUseSamples} disabled={!!busy} data-testid="home-use-samples">
          Use pre-prepared samples
        </button>
        <button className="btn btn-primary" onClick={onSave} disabled={!!busy || !canSave} data-testid="home-save">
          Save
        </button>
      </div>
    </div>
  );
}
