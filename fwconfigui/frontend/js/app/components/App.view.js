function AppView({ activeTab, onSetTab, error, loading, children }) {
  return (
    <>
      <div className="topbar">
        <div className="title">FW Config UI</div>
        <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 13 }}>{loading ? "Loading..." : ""}</div>
      </div>
      <div className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "rule-templates" ? "active" : ""}`}
            onClick={() => onSetTab("rule-templates")}
          >
            rule-templates
          </button>
          <button
            className={`tab ${activeTab === "port-protocol" ? "active" : ""}`}
            onClick={() => onSetTab("port-protocol")}
          >
            port-protocol
          </button>
          <button
            className={`tab ${activeTab === "business-purpose" ? "active" : ""}`}
            onClick={() => onSetTab("business-purpose")}
          >
            business-purpose
          </button>
          <button className={`tab ${activeTab === "components" ? "active" : ""}`} onClick={() => onSetTab("components")}>
            components
          </button>
          <button className={`tab ${activeTab === "keywords" ? "active" : ""}`} onClick={() => onSetTab("keywords")}>
            keywords
          </button>
          <button className={`tab ${activeTab === "rule-files" ? "active" : ""}`} onClick={() => onSetTab("rule-files")}>
            rule-files
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
