function App() {
  const tabToPath = React.useMemo(
    () => ({
      "rule-templates": "/rule-templates",
      "port-protocol": "/port-protocol",
      "business-purpose": "/business-purpose",
      env: "/env",
      keywords: "/keywords",
      "rule-files": "/rule-files",
    }),
    []
  );

  const pathToTab = React.useCallback(
    (pathname) => {
      const p = String(pathname || "/").trim();
      if (p === "/port-protocol") return "port-protocol";
      if (p === "/business-purpose") return "business-purpose";
      if (p === "/env") return "env";
      if (p === "/keywords") return "keywords";
      if (p === "/rule-files") return "rule-files";
      if (p === "/fw-rules") return "rule-templates";
      if (p === "/rule-templates") return "rule-templates";
      if (p === "/") return "rule-templates";
      return "rule-templates";
    },
    []
  );

  const [activeTab, setActiveTab] = React.useState("rule-templates");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/rule-templates");
    }

    const next = pathToTab(window.location.pathname);
    setActiveTab(next);

    const onPop = () => {
      setError("");
      setActiveTab(pathToTab(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathToTab]);

  const content = React.useMemo(() => {
    if (activeTab === "port-protocol") {
      return <PortProtocolTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "business-purpose") {
      return <BusinessPurposeTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "env") {
      return <EnvTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "keywords") {
      return <KeywordsTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "rule-files") {
      return <RuleFilesTable setLoading={setLoading} setError={setError} />;
    }
    return <FwRulesTable setLoading={setLoading} setError={setError} />;
  }, [activeTab]);

  return (
    <AppView
      activeTab={activeTab}
      onSetTab={(t) => {
        setError("");
        setActiveTab(t);

        const nextPath = tabToPath[t] || "/";
        if (window.location.pathname !== nextPath) {
          window.history.pushState({}, "", nextPath);
        }
      }}
      error={error}
      loading={loading}
    >
      {content}
    </AppView>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
