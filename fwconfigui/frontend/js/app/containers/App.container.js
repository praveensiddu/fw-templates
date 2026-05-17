function App() {
  const initialPathname = String(window?.location?.pathname || "/");
  const initialTopTab = (() => {
    const p = String(initialPathname || "/").trim();
    if (p === "/products" || p === "/infra/products") return "products";
    if (p.startsWith("/products/")) return "products";
    if (p === "/env" || p === "/infra" || p.startsWith("/infra/")) return "infra";
    return "products";
  })();

  const initialProductSubTab = (() => {
    const p = String(initialPathname || "/").trim();
    const pm = p.match(/^\/products\/[^/]+\/(rule-templates|port-protocol|business-purpose|components|keywords|rule-files)(?:\/.*)?$/);
    if (pm) return safeTrim(pm[1]) || "rule-templates";
    return "rule-templates";
  })();

  const initialInfraSubTab = (() => {
    const p = String(initialPathname || "/");
    if (p.startsWith("/infra/")) return String(p.split("/")[2] || "").trim() || "env";
    if (p === "/infra") return "env";
    if (p === "/env") return "env";
    return "env";
  })();

  const tabToPath = React.useMemo(
    () => ({
      products: "/products",
      infra: "/infra",
    }),
    []
  );

  const getProductFromPath = React.useCallback((pathname) => {
    const p = String(pathname || "");
    const m = p.match(/^\/products\/([^/]+)(?:\/|$)/);
    return m ? safeTrim(m[1]) : "";
  }, []);

  const [activeTab, setActiveTab] = React.useState(initialTopTab);
  const [infraSubTab, setInfraSubTab] = React.useState(initialInfraSubTab);
  const [productSubTab, setProductSubTab] = React.useState(initialProductSubTab);
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
      window.history.replaceState({}, "", "/products");
    }

    const p0 = String(window.location.pathname || "").trim();
    const m0 = p0.match(/^\/products\/([^/]+)$/);
    if (m0) {
      const prod = safeTrim(m0[1]);
      if (prod) {
        if (typeof setCurrentProduct === "function") setCurrentProduct(prod);
        window.history.replaceState({}, "", `/products/${encodeURIComponent(prod)}/rule-templates`);
      }
    }

    if (window.location.pathname === "/infra/products") {
      window.history.replaceState({}, "", "/products");
    }

    // Legacy (non-product) routes are no longer used for these pages.
    if (
      window.location.pathname === "/rule-templates" ||
      window.location.pathname === "/port-protocol" ||
      window.location.pathname === "/business-purpose" ||
      window.location.pathname === "/components" ||
      window.location.pathname === "/keywords" ||
      window.location.pathname === "/rule-files"
    ) {
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

    const pm = p.match(/^\/products\/[^/]+\/(rule-templates|port-protocol|business-purpose|components|keywords|rule-files)(?:\/.*)?$/);
    if (pm) {
      setProductSubTab(safeTrim(pm[1]) || "rule-templates");
      setActiveTab("products");
    } else if (p === "/products" || p.startsWith("/products/")) {
      setActiveTab("products");
    } else if (p === "/env" || p === "/infra" || p.startsWith("/infra/")) {
      setActiveTab("infra");
    } else {
      setActiveTab("products");
    }

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

      const pm = p.match(/^\/products\/[^/]+\/(rule-templates|port-protocol|business-purpose|components|keywords|rule-files)(?:\/.*)?$/);
      if (pm) {
        setProductSubTab(safeTrim(pm[1]) || "rule-templates");
        setActiveTab("products");
      } else if (p === "/products" || p.startsWith("/products/")) {
        setActiveTab("products");
      } else if (p === "/env" || p === "/infra" || p.startsWith("/infra/")) {
        setActiveTab("infra");
      } else {
        setActiveTab("products");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [canNavigateAway, setError]);

  const content = React.useMemo(() => {
    if (activeTab === "products") {
      const currentProduct = safeTrim(window.__fwCurrentProduct) || getProductFromPath(window.location.pathname);
      const hasProduct = isNonEmptyString(currentProduct);

      if (!hasProduct) {
        return <ProductsTable setLoading={setLoading} setError={setError} />;
      }

      const subTabs = (
        <div className="card" style={{ padding: 12 }}>
          <div className="actions" style={{ marginTop: 0, justifyContent: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`tab ${productSubTab === "rule-templates" ? "active" : ""}`}
                onClick={() => {
                  const nextPath = `/products/${encodeURIComponent(currentProduct)}/rule-templates`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("rule-templates");
                }}
              >
                rule-templates
              </button>
              <button
                className={`tab ${productSubTab === "port-protocol" ? "active" : ""}`}
                onClick={() => {
                  const nextPath = `/products/${encodeURIComponent(currentProduct)}/port-protocol`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("port-protocol");
                }}
              >
                port-protocol
              </button>
              <button
                className={`tab ${productSubTab === "business-purpose" ? "active" : ""}`}
                onClick={() => {
                  const nextPath = `/products/${encodeURIComponent(currentProduct)}/business-purpose`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("business-purpose");
                }}
              >
                business-purpose
              </button>
              <button
                className={`tab ${productSubTab === "components" ? "active" : ""}`}
                onClick={() => {
                  const nextPath = `/products/${encodeURIComponent(currentProduct)}/components`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("components");
                }}
              >
                components
              </button>
              <button
                className={`tab ${productSubTab === "keywords" ? "active" : ""}`}
                onClick={() => {
                  const nextPath = `/products/${encodeURIComponent(currentProduct)}/keywords`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("keywords");
                }}
              >
                keywords
              </button>
              <button
                className={`tab ${productSubTab === "rule-files" ? "active" : ""}`}
                onClick={() => {
                  const nextPath = `/products/${encodeURIComponent(currentProduct)}/rule-files`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("rule-files");
                }}
              >
                rule-files
              </button>
            </div>
          </div>
        </div>
      );

      const body = (() => {
        if (productSubTab === "port-protocol") return <PortProtocolTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "business-purpose") return <BusinessPurposeTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "components") return <ComponentsTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "keywords") return <KeywordsTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "rule-files") return <RuleFilesTable setLoading={setLoading} setError={setError} />;
        return <FwRulesTable setLoading={setLoading} setError={setError} />;
      })();

      return (
        <>
          {subTabs}
          {body}
        </>
      );
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
  }, [activeTab, infraSubTab, productSubTab, getProductFromPath]);

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

          if (t === "products") {
            nextPath = "/products";
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
