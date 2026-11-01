function AppView({ activeTab, onSetTab, error, loading, children, homeInitialized, demoMode, currentUser, demoUsers, onSwitchUser }) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [switchMenuOpen, setSwitchMenuOpen] = React.useState(false);
  const user = safeTrim(currentUser);
  const switchOptions = (Array.isArray(demoUsers) ? demoUsers : []).filter((u) => safeTrim(u) && safeTrim(u) !== user);

  return (
    <>
      <div className="topbar">
        <div className="title">FW Config UI</div>
        <div style={{ color: "rgba(255,255,255,0.95)", fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
          {demoMode ? "DEMO_MODE" : ""}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", color: "rgba(255,255,255,0.88)", fontSize: 13 }}>
          <span>{loading ? "Loading..." : ""}</span>
          {demoMode ? (
            <span style={{ position: "relative", display: "inline-flex" }}>
              <button
                className="btn"
                style={{ padding: "2px 10px", fontSize: 12, background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.95)" }}
                onClick={() => setSwitchMenuOpen((v) => !v)}
              >
                switch user
              </button>
              {switchMenuOpen ? (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                    onClick={() => setSwitchMenuOpen(false)}
                  />
                  <div
                    className="card"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      zIndex: 41,
                      padding: 4,
                      minWidth: 140,
                      color: "#333",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {switchOptions.length === 0 ? (
                      <div className="muted" style={{ padding: "6px 10px" }}>no other users</div>
                    ) : (
                      switchOptions.map((u) => (
                        <div
                          key={u}
                          style={{ padding: "6px 10px", cursor: "pointer", borderRadius: 4 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          onClick={() => {
                            setSwitchMenuOpen(false);
                            if (typeof onSwitchUser === "function") onSwitchUser(u);
                          }}
                        >
                          {u}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </span>
          ) : null}
          <span style={{ position: "relative", display: "inline-flex" }}>
            <button
              className="iconBtn"
              title={user ? `Logged in as ${user}` : "User"}
              style={{ color: "rgba(255,255,255,0.9)", border: "none", background: "transparent", cursor: "pointer", padding: 4 }}
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </button>
            {userMenuOpen ? (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  className="card"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    zIndex: 41,
                    padding: "8px 12px",
                    minWidth: 140,
                    color: "#333",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div className="muted" style={{ fontSize: 11, marginBottom: 2 }}>logged in as</div>
                  <div style={{ fontWeight: 700 }}>{user || "unknown"}</div>
                </div>
              </>
            ) : null}
          </span>
        </div>
      </div>
      <div className="container">
        {isNonEmptyString(getCurrentProductFromPath()) ? null : (
          <div className="tabs">
            {homeInitialized ? (
              <>
                <button className={`tab ${activeTab === "products" ? "active" : ""}`} onClick={() => onSetTab("products")}>
                  products
                </button>
                <button className={`tab ${activeTab === "infra" ? "active" : ""}`} onClick={() => onSetTab("infra")}>
                  infra
                </button>
                <button className={`tab ${activeTab === "role-mgmt" ? "active" : ""}`} onClick={() => onSetTab("role-mgmt")}>
                  role management
                </button>
              </>
            ) : null}
            <button className={`tab ${activeTab === "home" ? "active" : ""}`} onClick={() => onSetTab("home")}>
              Home
            </button>
          </div>
        )}

        {error ? (
          <div className="card" style={{ padding: 12, borderColor: "rgba(220,53,69,0.5)", color: "#dc3545" }}>
            {error}
          </div>
        ) : null}

        {children}
      </div>
    </>
  );
}
