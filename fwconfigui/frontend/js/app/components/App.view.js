function AppView({ activeTab, onSetTab, error, loading, children }) {
  return (
    <>
      <div className="topbar">
        <div className="title">FW Config UI</div>
        <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 13 }}>{loading ? "Loading..." : ""}</div>
      </div>
      <div className="container">
        <div className="tabs">
          <button className={`tab ${activeTab === "products" ? "active" : ""}`} onClick={() => onSetTab("products")}>
            products
          </button>
          <button className={`tab ${activeTab === "infra" ? "active" : ""}`} onClick={() => onSetTab("infra")}>
            infra
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
