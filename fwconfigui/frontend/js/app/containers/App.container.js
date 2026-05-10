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

  const [navConfirm, setNavConfirm] = React.useState({
    show: false,
    busy: false,
    resolve: null,
  });

  const lastAllowedPathRef = React.useRef("/rule-templates");

  const canNavigateAway = React.useCallback(async () => {
    const guard = window.__fwRulesNavGuard;
    if (!guard || typeof guard.hasUnsavedChanges !== "function") return true;
    if (!guard.hasUnsavedChanges()) return true;

    if (navConfirm.show) return false;

    return await new Promise((resolve) => {
      setNavConfirm({ show: true, busy: false, resolve });
    });
  }, [navConfirm.show]);

  React.useEffect(() => {
    window.__fwRulesRequestNavConfirm = canNavigateAway;
    return () => {
      if (window.__fwRulesRequestNavConfirm) delete window.__fwRulesRequestNavConfirm;
    };
  }, [canNavigateAway]);

  React.useEffect(() => {
    const onBeforeUnload = (e) => {
      const guard = window.__fwRulesNavGuard;
      if (!guard || typeof guard.hasUnsavedChanges !== "function") return;
      if (!guard.hasUnsavedChanges()) return;

      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
      return "You have unsaved changes.";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  React.useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/rule-templates");
    }

    lastAllowedPathRef.current = `${window.location.pathname}${window.location.search}` || "/rule-templates";

    const next = pathToTab(window.location.pathname);
    setActiveTab(next);

    const onPop = async () => {
      const ok = await canNavigateAway();
      if (!ok) {
        window.history.pushState({}, "", lastAllowedPathRef.current || "/rule-templates");
        return;
      }
      setError("");
      const full = `${window.location.pathname}${window.location.search}`;
      lastAllowedPathRef.current = full;
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
    <>
      <AppView
        activeTab={activeTab}
        onSetTab={async (t) => {
          const ok = await canNavigateAway();
          if (!ok) return;

          setError("");
          setActiveTab(t);

          const nextPath = tabToPath[t] || "/";
          if (window.location.pathname !== nextPath) {
            window.history.pushState({}, "", nextPath);
          }
          lastAllowedPathRef.current = nextPath;
        }}
        error={error}
        loading={loading}
      >
        {content}
      </AppView>

      {navConfirm.show ? (
        <div
          className="modalOverlay"
          onClick={() => {
            if (navConfirm.busy) return;
            const r = navConfirm.resolve;
            setNavConfirm({ show: false, busy: false, resolve: null });
            if (typeof r === "function") r(false);
          }}
        >
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>You have unsaved changes</h3>
              <button
                className="btn"
                onClick={() => {
                  if (navConfirm.busy) return;
                  const r = navConfirm.resolve;
                  setNavConfirm({ show: false, busy: false, resolve: null });
                  if (typeof r === "function") r(false);
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              Choose what you want to do before leaving this page.
            </div>

            <div className="modalActions">
              <button
                className="btn"
                onClick={() => {
                  if (navConfirm.busy) return;
                  const r = navConfirm.resolve;
                  setNavConfirm({ show: false, busy: false, resolve: null });
                  if (typeof r === "function") r(false);
                }}
              >
                Stay
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (navConfirm.busy) return;
                  const guard = window.__fwRulesNavGuard;
                  if (guard && typeof guard.discard === "function") {
                    guard.discard();
                  }
                  const r = navConfirm.resolve;
                  setNavConfirm({ show: false, busy: false, resolve: null });
                  if (typeof r === "function") r(true);
                }}
              >
                Discard
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (navConfirm.busy) return;
                  setNavConfirm((p) => ({ ...p, busy: true }));
                  try {
                    const guard = window.__fwRulesNavGuard;
                    if (guard && typeof guard.save === "function") {
                      await guard.save();
                    }
                    const r = navConfirm.resolve;
                    setNavConfirm({ show: false, busy: false, resolve: null });
                    if (typeof r === "function") r(true);
                  } catch (e) {
                    const r = navConfirm.resolve;
                    setNavConfirm({ show: false, busy: false, resolve: null });
                    if (typeof r === "function") r(false);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
