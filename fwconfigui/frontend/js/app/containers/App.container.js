function App() {
  const initialPathname = String(window?.location?.pathname || "/");
  const initialTopTab = (() => {
    const p = String(initialPathname || "/").trim();
    if (p === "/products" || p === "/infra/products") return "products";
    if (p.startsWith("/products/")) return "products";
    if (p === "/env" || p === "/infra" || p.startsWith("/infra/")) return "infra";
    if (p === "/role-management" || p.startsWith("/role-management/")) return "role-mgmt";
    if (p === "/home" || p.startsWith("/home/")) return "home";
    return "products";
  })();

  const initialProductSubTab = (() => {
    const p = String(initialPathname || "/").trim();
    const pm = p.match(/^\/products\/[^/]+\/(rule-templates|port-protocol|business-purpose|components|keywords|rule-files|groups|addrs|rules|ip_inventory)(?:\/.*)?$/);
    if (pm) return safeTrim(pm[1]) || "rule-templates";
    return "rule-templates";
  })();

  const initialProductEnv = (() => {
    const p = String(initialPathname || "/").trim();
    const m = p.match(/^\/products\/[^/]+\/(groups|addrs|rules|ip_inventory)\/([^/]+)(?:\/.*)?$/);
    if (m) return safeTrim(m[2]) || "";
    return "";
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
      "role-mgmt": "/role-management",
      home: "/home",
    }),
    []
  );

  const getProductFromPath = React.useCallback((pathname) => {
    const p = String(pathname || "");
    const m = p.match(/^\/products\/([^/]+)(?:\/|$)/);
    return m ? safeTrim(m[1]) : "";
  }, []);

  const getProductEnvFromPath = React.useCallback((pathname) => {
    const p = String(pathname || "");
    const m = p.match(/^\/products\/[^/]+\/(groups|addrs|rules|ip_inventory)\/([^/]+)(?:\/|$)/);
    return m ? safeTrim(m[2]) : "";
  }, []);

  const [activeTab, setActiveTab] = React.useState(initialTopTab);
  const [infraSubTab, setInfraSubTab] = React.useState(initialInfraSubTab);
  const [productSubTab, setProductSubTab] = React.useState(initialProductSubTab);
  const [productEnv, setProductEnv] = React.useState(initialProductEnv);
  const [routeVersion, setRouteVersion] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [homeInitialized, setHomeInitialized] = React.useState(null);

  const [infraEnvItems, setInfraEnvItems] = React.useState([]);
  const [productItems, setProductItems] = React.useState([]);
  const [productEnvOptions, setProductEnvOptions] = React.useState([]);

  const [navConfirm, setNavConfirm] = React.useState({
    show: false,
    busy: false,
    resolve: null,
  });

  const lastAllowedPathRef = React.useRef("/rule-templates");
  const fetchProductRecordRetryRef = React.useRef(0);

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

    setRouteVersion((v) => v + 1);

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

    const pm = p.match(/^\/products\/[^/]+\/(rule-templates|port-protocol|business-purpose|components|keywords|rule-files|groups|addrs|rules|ip_inventory)(?:\/.*)?$/);
    if (pm) {
      setProductSubTab(safeTrim(pm[1]) || "rule-templates");
      setActiveTab("products");
    } else if (p === "/products" || p.startsWith("/products/")) {
      setActiveTab("products");
    } else if (p === "/env" || p === "/infra" || p.startsWith("/infra/")) {
      setActiveTab("infra");
    } else if (p === "/role-management" || p.startsWith("/role-management/")) {
      setActiveTab("role-mgmt");
    } else if (p === "/home" || p.startsWith("/home/")) {
      setActiveTab("home");
    } else {
      setActiveTab("products");
    }

    const applyRouteFromLocation = () => {
      setRouteVersion((v) => v + 1);
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

      const prod = getProductFromPath(p);
      if (prod && typeof setCurrentProduct === "function") {
        setCurrentProduct(prod);
      }

      const pm = p.match(
        /^\/products\/[^/]+\/(rule-templates|port-protocol|business-purpose|components|keywords|rule-files|groups|addrs|rules|ip_inventory)(?:\/.*)?$/
      );
      if (pm) {
        setProductSubTab(safeTrim(pm[1]) || "rule-templates");
        setActiveTab("products");
        const envMatch = p.match(/^\/products\/[^/]+\/(groups|addrs|rules|ip_inventory)\/([^/]+)(?:\/.*)?$/);
        if (envMatch) {
          setProductEnv(safeTrim(envMatch[2]) || "");
        } else {
          setProductEnv("");
        }
      } else if (p === "/products" || p.startsWith("/products/")) {
        setActiveTab("products");
      } else if (p === "/env" || p === "/infra" || p.startsWith("/infra/")) {
        setActiveTab("infra");
      } else if (p === "/role-management" || p.startsWith("/role-management/")) {
        setActiveTab("role-mgmt");
      } else if (p === "/home" || p.startsWith("/home/")) {
        setActiveTab("home");
      } else {
        setActiveTab("products");
      }
    };

    const onPop = async () => {
      const ok = await canNavigateAway();
      if (!ok) {
        window.history.pushState({}, "", lastAllowedPathRef.current || "/rule-templates");
        return;
      }

      applyRouteFromLocation();
    };

    const onLocationChange = async () => {
      const ok = await canNavigateAway();
      if (!ok) {
        window.history.pushState({}, "", lastAllowedPathRef.current || "/rule-templates");
        return;
      }
      applyRouteFromLocation();
    };

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    const fireLocationChange = () => window.dispatchEvent(new Event("locationchange"));
    window.history.pushState = function (...args) {
      const ret = origPush.apply(this, args);
      fireLocationChange();
      return ret;
    };
    window.history.replaceState = function (...args) {
      const ret = origReplace.apply(this, args);
      fireLocationChange();
      return ret;
    };

    window.addEventListener("popstate", onPop);
    window.addEventListener("locationchange", onLocationChange);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("locationchange", onLocationChange);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, [canNavigateAway, setError]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await loadHomeSettings();
        if (!cancelled) setHomeInitialized(!!resp?.initialized);
      } catch (e) {
        if (!cancelled) setHomeInitialized(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onHomeSaved = React.useCallback(() => {
    setHomeInitialized(true);
  }, []);

  React.useEffect(() => {
    const loadEnv = async () => {
      try {
        const resp = await listFwConfigItems("env");
        setInfraEnvItems(resp?.items || []);
      } catch (e) {
        // Ignore env load errors here; feature pages will surface errors on use.
      }
    };
    loadEnv();
  }, []);

  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        const resp = await listFwConfigItems("products");
        setProductItems(resp?.items || []);
      } catch (e) {
        // Ignore products load errors here; feature pages will surface errors on use.
      }
    };
    loadProducts();
  }, []);

  React.useEffect(() => {
    const currentProduct = safeTrim(window.__fwCurrentProduct) || getProductFromPath(window.location.pathname);
    if (!isNonEmptyString(currentProduct)) {
      if ((productEnvOptions || []).length) setProductEnvOptions([]);
      return;
    }

    if (activeTab !== "products") return;
    if (productSubTab !== "groups" && productSubTab !== "addrs" && productSubTab !== "rules" && productSubTab !== "ip_inventory") return;

    const productRow = (productItems || []).find((it) => safeTrim(it?.name) === currentProduct);
    const fromList = (Array.isArray(productRow?.data?.envs) ? productRow.data.envs : [])
      .map((x) => safeTrim(x))
      .filter(Boolean);
    if (fromList.length) {
      setProductEnvOptions(fromList);
      return;
    }

    const fn = typeof window !== "undefined" ? window.fetchProductRecord : null;
    if (typeof fn !== "function") {
      if (fetchProductRecordRetryRef.current < 10) {
        fetchProductRecordRetryRef.current += 1;
        const t = setTimeout(() => setRouteVersion((v) => v + 1), 50);
        return () => clearTimeout(t);
      }
      return;
    }

    fetchProductRecordRetryRef.current = 0;

    let cancelled = false;
    (async () => {
      try {
        const row = await fn(currentProduct);
        const envs = row?.data?.envs;
        const next = (Array.isArray(envs) ? envs : [])
          .map((x) => safeTrim(x))
          .filter(Boolean);
        if (!cancelled) setProductEnvOptions(next);
      } catch (e) {
        if (!cancelled) setProductEnvOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, productSubTab, routeVersion, getProductFromPath, productItems]);

  React.useEffect(() => {
    if (activeTab !== "products") return;
    if (productSubTab !== "groups" && productSubTab !== "addrs" && productSubTab !== "rules" && productSubTab !== "ip_inventory") return;

    const currentProduct = safeTrim(window.__fwCurrentProduct) || getProductFromPath(window.location.pathname);
    if (!isNonEmptyString(currentProduct)) return;

    const envFromPath = getProductEnvFromPath(window.location.pathname);
    const envNames = (productEnvOptions || []).length ? productEnvOptions : [];
    if (envNames.length === 0) return;

    const preferred = safeTrim(envFromPath) || safeTrim(productEnv) || (envNames.length ? envNames[0] : "");
    if (!preferred) return;
    if (!safeTrim(productEnv) || safeTrim(productEnv) !== preferred) {
      setProductEnv(preferred);
    }

    const expected = `/products/${encodeURIComponent(currentProduct)}/${encodeURIComponent(productSubTab)}/${encodeURIComponent(preferred)}`;
    if (`${window.location.pathname}${window.location.search}` !== expected) {
      window.history.replaceState({}, "", expected);
      setRouteVersion((v) => v + 1);
    }
  }, [activeTab, productSubTab, productEnv, infraEnvItems, productEnvOptions, getProductFromPath, getProductEnvFromPath]);

  const content = React.useMemo(() => {
    if (homeInitialized !== true || activeTab === "home") {
      return <Home setLoading={setLoading} setError={setError} onSaved={onHomeSaved} />;
    }
    if (activeTab === "products") {
      const currentProduct = safeTrim(window.__fwCurrentProduct) || getProductFromPath(window.location.pathname);
      const hasProduct = isNonEmptyString(currentProduct);

      if (!hasProduct) {
        return <ProductsTable setLoading={setLoading} setError={setError} />;
      }

      const envScopedTabs = ["groups", "addrs", "rules", "ip_inventory"];
      const productTabs = [
        { key: "rule-templates", label: "Rule Templates" },
        { key: "components", label: "Components" },
        { key: "groups", label: "Groups" },
        { key: "addrs", label: "Addresses" },
        { key: "rules", label: "Rules" },
        { key: "port-protocol", label: "Port Protocol" },
        { key: "business-purpose", label: "Business Purpose" },
        { key: "keywords", label: "Keywords" },
        { key: "rule-files", label: "Rule Files" },
        { key: "ip_inventory", label: "IP Inventory" },
      ];

      const selectProductTab = (it) => {
        const key = it.key;
        const envScoped = envScopedTabs.includes(key);
        const nextEnv = envScoped
          ? safeTrim(productEnv) || getProductEnvFromPath(window.location.pathname) || ((productEnvOptions || [])[0] || "")
          : "";
        const base = `/products/${encodeURIComponent(currentProduct)}/${key}`;
        const nextPath = nextEnv ? `${base}/${encodeURIComponent(nextEnv)}` : base;
        if (`${window.location.pathname}${window.location.search}` !== nextPath) {
          window.history.pushState({}, "", nextPath);
        }
        setProductSubTab(key);
        if (envScoped) setProductEnv(nextEnv);
        else if (key === "rule-files") setProductEnv("");
      };

      const goBackToProducts = async () => {
        const ok = await canNavigateAway();
        if (!ok) return;
        if (typeof setCurrentProduct === "function") setCurrentProduct("");
        if (window.__fwCurrentProduct) window.__fwCurrentProduct = "";
        if (`${window.location.pathname}${window.location.search}` !== "/products") {
          window.history.pushState({}, "", "/products");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      };

      const subTabs = (
        <div className="contextBar">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a
              href="/products"
              onClick={(e) => {
                e.preventDefault();
                goBackToProducts();
              }}
            >
              Products
            </a>
            <span className="breadcrumbSep" aria-hidden="true">/</span>
            <span className="breadcrumbCurrent" aria-current="page">{currentProduct}</span>
          </nav>
          <SubNav items={productTabs} activeKey={productSubTab} onSelect={selectProductTab} ariaLabel="Product sections" />
          {envScopedTabs.includes(productSubTab) ? (
            <div className="envBar">
              <span className="envBarLabel">Environment</span>
              <SubNav
                variant="pill"
                ariaLabel="Environment"
                items={(productEnvOptions || []).map((n) => ({ key: n, label: n }))}
                activeKey={safeTrim(productEnv)}
                onSelect={(it) => {
                  const nextPath = `/products/${encodeURIComponent(currentProduct)}/${encodeURIComponent(productSubTab)}/${encodeURIComponent(it.key)}`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductEnv(it.key);
                }}
              />
            </div>
          ) : null}
        </div>
      );

      const body = (() => {
        if (productSubTab === "port-protocol") return <PortProtocolTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "business-purpose") return <BusinessPurposeTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "components") return <ComponentsTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "keywords") return <KeywordsTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "rule-files") return <RuleFilesTable setLoading={setLoading} setError={setError} />;
        if (productSubTab === "groups") {
          return safeTrim(productEnv) ? (
            <GroupsTable env={safeTrim(productEnv)} setLoading={setLoading} setError={setError} />
          ) : (
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Select an env.</div>
            </div>
          );
        }
        if (productSubTab === "addrs") {
          return safeTrim(productEnv) ? (
            <AddrsTable env={safeTrim(productEnv)} setLoading={setLoading} setError={setError} />
          ) : (
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Select an env.</div>
            </div>
          );
        }
        if (productSubTab === "rules") {
          return safeTrim(productEnv) ? (
            <RulesTable env={safeTrim(productEnv)} setLoading={setLoading} setError={setError} />
          ) : (
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Select an env.</div>
            </div>
          );
        }
        if (productSubTab === "ip_inventory") {
          return safeTrim(productEnv) ? (
            <IpInventoryTable env={safeTrim(productEnv)} setLoading={setLoading} setError={setError} />
          ) : (
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Select an env.</div>
            </div>
          );
        }
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
          <div className="contextBar">
            <SubNav
              ariaLabel="Infrastructure sections"
              activeKey={infraSubTab}
              items={[
                { key: "env", label: "Environments" },
                { key: "networkarea", label: "Network Areas" },
                { key: "site", label: "Sites" },
                { key: "predef-port-protocol", label: "Predefined Port Protocols" },
              ]}
              onSelect={(it) => {
                setInfraSubTab(it.key);
                const p = `/infra/${it.key}`;
                if (window.location.pathname !== p) {
                  window.history.pushState({}, "", p);
                }
              }}
            />
          </div>
          {infraSubTab === "env" ? <EnvTable setLoading={setLoading} setError={setError} /> : null}
          {infraSubTab === "networkarea" ? <NetworkAreasTable setLoading={setLoading} setError={setError} /> : null}
          {infraSubTab === "site" ? <SitesTable setLoading={setLoading} setError={setError} /> : null}
          {infraSubTab === "predef-port-protocol" ? <PredefPortProtocolTable setLoading={setLoading} setError={setError} /> : null}
        </>
      );
    }
    if (activeTab === "role-mgmt") {
      return <RoleMgmt setLoading={setLoading} setError={setError} />;
    }
    return <FwRulesTable setLoading={setLoading} setError={setError} />;
  }, [activeTab, homeInitialized, onHomeSaved, infraSubTab, productSubTab, productEnv, infraEnvItems, getProductFromPath, getProductEnvFromPath, routeVersion]);

  return (
    <>
      <AppView
        activeTab={homeInitialized === true ? activeTab : "home"}
        homeInitialized={homeInitialized === true}
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

          if (t === "role-mgmt") {
            nextPath = "/role-management";
          }

          if (t === "products") {
            const currentProduct = safeTrim(window.__fwCurrentProduct) || getProductFromPath(window.location.pathname);
            if (isNonEmptyString(currentProduct)) {
              const sub = safeTrim(productSubTab) || "rule-templates";
              if (sub === "groups" || sub === "addrs") {
                const envNames = (infraEnvItems || [])
                  .map((x) => safeTrim(x?.name))
                  .filter(Boolean);
                const nextEnv = safeTrim(productEnv) || (envNames.length ? envNames[0] : "default");
                nextPath = `/products/${encodeURIComponent(currentProduct)}/${encodeURIComponent(sub)}/${encodeURIComponent(nextEnv)}`;
              } else {
                nextPath = `/products/${encodeURIComponent(currentProduct)}/${encodeURIComponent(sub)}`;
              }
            } else {
              nextPath = "/products";
            }
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
