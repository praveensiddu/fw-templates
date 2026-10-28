function AppView({ activeTab, onSetTab, error, loading, children, homeInitialized, demoMode, currentUser, demoUsers, onSwitchUser }) {
  const user = safeTrim(currentUser);
  const switchOptions = Array.isArray(demoUsers) ? demoUsers.slice() : [];
  if (user && !switchOptions.includes(user)) switchOptions.push(user);

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
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span>switch user</span>
              <select
                style={{ padding: "2px 6px", fontSize: 12, borderRadius: 4, border: "1px solid rgba(255,255,255,0.5)" }}
                value={user || ""}
                onChange={(e) => {
                  if (typeof onSwitchUser === "function") onSwitchUser(e.target.value);
                }}
              >
                {!user ? <option value="">select user</option> : null}
                {switchOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <span>
            logged in as <b>{user || "unknown"}</b>
          </span>
        </div>
      </div>
      <div className="container">
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
