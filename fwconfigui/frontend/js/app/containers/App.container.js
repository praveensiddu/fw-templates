function App() {
  const tabToPath = React.useMemo(
    () => ({
      products: "/products",
      "rule-templates": "/rule-templates",
      "port-protocol": "/port-protocol",
      "business-purpose": "/business-purpose",
      components: "/components",
      keywords: "/keywords",
      "rule-files": "/rule-files",
      infra: "/infra",
    }),
    []
  );

  const pathToTab = React.useCallback(
    (pathname) => {
      const p = String(pathname || "/").trim();
      if (p === "/products") return "products";
      if (p === "/infra/products") return "products";
      if (p === "/port-protocol") return "port-protocol";
      if (p === "/business-purpose") return "business-purpose";
      if (p === "/components" || p.startsWith("/components/")) return "components";
      if (p === "/env") return "infra";
      if (p === "/keywords") return "keywords";
      if (p === "/rule-files") return "rule-files";
      if (p === "/infra" || p.startsWith("/infra/")) return "infra";
      if (p === "/fw-rules") return "rule-templates";
      if (p === "/rule-templates") return "rule-templates";
      if (p === "/") return "rule-templates";
      return "rule-templates";
    },
    []
  );

  const [activeTab, setActiveTab] = React.useState("rule-templates");
  const [infraSubTab, setInfraSubTab] = React.useState("env");
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

    if (window.location.pathname === "/infra/products") {
      window.history.replaceState({}, "", "/products");
    }

    lastAllowedPathRef.current = `${window.location.pathname}${window.location.search}` || "/rule-templates";

    const p = String(window.location.pathname || "/");
    if (p === "/env") {
      setInfraSubTab("env");
    } else if (p.startsWith("/infra/")) {
      const sub = String(p.split("/")[2] || "").trim() || "env";
      setInfraSubTab(sub);
    } else if (p === "/infra") {
      setInfraSubTab("env");
      window.history.replaceState({}, "", "/infra/env");
    }

    const next = pathToTab(window.location.pathname);
    setActiveTab(next);

    const onPop = async () => {
      const ok = await canNavigateAway();
      if (!ok) {
        window.history.pushState({}, "", lastAllowedPathRef.current || "/rule-templates");
        return;
      }
      setError("");

      if (window.location.pathname === "/infra/products") {
        window.history.replaceState({}, "", "/products");
      }

      const full = `${window.location.pathname}${window.location.search}`;
      lastAllowedPathRef.current = full;

      const p = String(window.location.pathname || "/");
      if (p === "/env") {
        setInfraSubTab("env");
      } else if (p.startsWith("/infra/")) {
        const sub = String(p.split("/")[2] || "").trim() || "env";
        setInfraSubTab(sub);
      } else if (p === "/infra") {
        setInfraSubTab("env");
        window.history.replaceState({}, "", "/infra/env");
      }
      setActiveTab(pathToTab(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathToTab]);

  const content = React.useMemo(() => {
    if (activeTab === "products") {
      return <ProductsTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "port-protocol") {
      return <PortProtocolTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "business-purpose") {
      return <BusinessPurposeTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "components") {
      return <ComponentsTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "keywords") {
      return <KeywordsTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "rule-files") {
      return <RuleFilesTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "infra") {
      return (
        <>
          <div className="card" style={{ padding: 12 }}>
            <div className="actions" style={{ marginTop: 0, justifyContent: "flex-start" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`tab ${infraSubTab === "env" ? "active" : ""}`}
                  onClick={() => {
                    setInfraSubTab("env");
                    if (window.location.pathname !== "/infra/env") {
                      window.history.pushState({}, "", "/infra/env");
                    }
                  }}
                >
                  env
                </button>
                <button
                  className={`tab ${infraSubTab === "networkarea" ? "active" : ""}`}
                  onClick={() => {
                    setInfraSubTab("networkarea");
                    if (window.location.pathname !== "/infra/networkarea") {
                      window.history.pushState({}, "", "/infra/networkarea");
                    }
                  }}
                >
                  networkarea
                </button>
                <button
                  className={`tab ${infraSubTab === "site" ? "active" : ""}`}
                  onClick={() => {
                    setInfraSubTab("site");
                    if (window.location.pathname !== "/infra/site") {
                      window.history.pushState({}, "", "/infra/site");
                    }
                  }}
                >
                  site
                </button>
              </div>
            </div>
          </div>
          {infraSubTab === "env" ? <EnvTable setLoading={setLoading} setError={setError} /> : null}
          {infraSubTab === "networkarea" ? <NetworkAreasTable setLoading={setLoading} setError={setError} /> : null}
          {infraSubTab === "site" ? <SitesTable setLoading={setLoading} setError={setError} /> : null}
        </>
      );
    }
    return <FwRulesTable setLoading={setLoading} setError={setError} />;
  }, [activeTab, infraSubTab]);

  return (
    <>
      <AppView
        activeTab={activeTab}
        onSetTab={async (t) => {
          const ok = await canNavigateAway();
          if (!ok) return;

          setError("");
          setActiveTab(t);

          let nextPath = tabToPath[t] || "/";
          if (t === "infra") {
            setInfraSubTab("env");
            nextPath = "/infra/env";
          }
          if (t === "components") {
            nextPath = "/components";
          }
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
