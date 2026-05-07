function App() {
  const tabToPath = React.useMemo(
    () => ({
      "fw-rules": "/fw-rules",
      "port-protocol": "/port-protocol",
      "business-purpose": "/business-purpose",
      env: "/env",
      keywords: "/keywords",
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
      if (p === "/fw-rules") return "fw-rules";
      if (p === "/") return "fw-rules";
      return "fw-rules";
    },
    []
  );

  const [activeTab, setActiveTab] = React.useState("fw-rules");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/fw-rules");
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
