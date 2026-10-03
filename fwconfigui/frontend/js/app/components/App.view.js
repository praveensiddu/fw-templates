function AppView({
  activeTab,
  onSetTab,
  error,
  loading,
  children,
  currentUser,
  demoUsers,
  onSwitchDemoUser,
  userBusy,
}) {
  const username = safeTrim(currentUser?.username) || safeTrim(currentUser?.user) || "unknown";
  const roles = Array.isArray(currentUser?.roles) ? currentUser.roles.filter((r) => safeTrim(r)) : [];
  const rolesSummary = roles.length ? roles.join(", ") : "no roles";
  const demoUserList = Array.isArray(demoUsers) ? demoUsers : [];

  return (
    <>
      <div className="topbar">
        <div className="title">FW Config UI</div>
        <div className="topbarUserSection">
          {loading ? <span className="topbarMeta">Loading...</span> : null}
          <div className="topbarUserInfo">
            <span className="topbarUserName">{username}</span>
            <span className="topbarUserRoles">{rolesSummary}</span>
          </div>
          {demoUserList.length ? (
            <select
              className="topbarDemoSelect"
              value={username}
              disabled={!!userBusy}
              onChange={(e) => {
                const next = safeTrim(e.target.value);
                if (next && typeof onSwitchDemoUser === "function") onSwitchDemoUser(next);
              }}
            >
              {demoUserList.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
      <div className="container">
        <div className="tabs">
          <button className={`tab ${activeTab === "products" ? "active" : ""}`} onClick={() => onSetTab("products")}>
            products
          </button>
          <button className={`tab ${activeTab === "infra" ? "active" : ""}`} onClick={() => onSetTab("infra")}>
            infra
          </button>
          <button
            className={`tab ${activeTab === "access-requests" ? "active" : ""}`}
            onClick={() => onSetTab("access-requests")}
          >
            Access Requests
          </button>
          <button className={`tab ${activeTab === "role-mgmt" ? "active" : ""}`} onClick={() => onSetTab("role-mgmt")}>
            role management
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
