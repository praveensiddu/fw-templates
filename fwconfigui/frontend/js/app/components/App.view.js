function AppView({ activeTab, onSetTab, error, loading, children, homeInitialized }) {
  const items = homeInitialized
    ? [
        { key: "home", label: "Home" },
        { key: "products", label: "Products" },
        { key: "infra", label: "Infrastructure" },
        { key: "role-mgmt", label: "Role Management" },
      ]
    : [{ key: "home", label: "Home" }];

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brandMark" aria-hidden="true">FW</span>
          <span className="title">FW Config</span>
        </div>
        <nav className="primaryNav" role="tablist" aria-label="Main sections">
          {items.map((it) => (
            <button
              key={it.key}
              role="tab"
              aria-selected={activeTab === it.key}
              className={`navTab ${activeTab === it.key ? "active" : ""}`}
              onClick={() => onSetTab(it.key)}
            >
              {it.label}
            </button>
          ))}
        </nav>
        <div className="topbarStatus" role="status" aria-live="polite">
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Loading…
            </>
          ) : null}
        </div>
      </header>
      <main className="container">
        {error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : null}

        {children}
      </main>
    </>
  );
}

function SubNav({ items, activeKey, onSelect, ariaLabel, variant }) {
  return (
    <div className={`subNav ${variant === "pill" ? "subNav-pill" : ""}`} role="tablist" aria-label={ariaLabel}>
      {items.map((it) => (
        <button
          key={it.key}
          role="tab"
          aria-selected={activeKey === it.key}
          className={`subTab ${activeKey === it.key ? "active" : ""}`}
          onClick={() => onSelect(it)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
