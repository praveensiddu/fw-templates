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
    const pm = p.match(/^\/products\/[^/]+\/(port-protocol|components|keywords|rule-files|groups|addrs|rules|ip_inventory)(?:\/.*)?$/);
    if (pm) return safeTrim(pm[1]) || "components";
    return "components";
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

  const [currentUserInfo, setCurrentUserInfo] = React.useState({ user: "", demo_mode: false });
  const [demoUsers, setDemoUsers] = React.useState([]);

  const [infraEnvItems, setInfraEnvItems] = React.useState([]);
  const [productItems, setProductItems] = React.useState([]);
  const [productEnvOptions, setProductEnvOptions] = React.useState([]);

  const fetchProductRecordRetryRef = React.useRef(0);

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
        window.history.replaceState({}, "", `/products/${encodeURIComponent(prod)}/components`);
      }
    }

    if (window.location.pathname === "/infra/products") {
      window.history.replaceState({}, "", "/products");
    }

    // Legacy (non-product) routes are no longer used for these pages.
    if (
      window.location.pathname === "/port-protocol" ||
      window.location.pathname === "/components" ||
      window.location.pathname === "/keywords" ||
      window.location.pathname === "/rule-files"
    ) {
      window.history.replaceState({}, "", "/products");
    }

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

    const pm = p.match(/^\/products\/[^/]+\/(port-protocol|components|keywords|rule-files|groups|addrs|rules|ip_inventory)(?:\/.*)?$/);
    if (pm) {
      setProductSubTab(safeTrim(pm[1]) || "components");
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
        /^\/products\/[^/]+\/(port-protocol|components|keywords|rule-files|groups|addrs|rules|ip_inventory)(?:\/.*)?$/
      );
      if (pm) {
        setProductSubTab(safeTrim(pm[1]) || "components");
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

    const onPop = () => {
      applyRouteFromLocation();
    };

    const onLocationChange = () => {
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
  }, [setError]);

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
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetchJson("/api/v1/current-user");
        if (cancelled) return;
        setCurrentUserInfo(resp && typeof resp === "object" ? resp : {});
        if (resp?.demo_mode) {
          try {
            const du = await fetchJson("/api/v1/demo-users");
            if (!cancelled) {
              setDemoUsers(du && typeof du === "object" ? Object.keys(du).sort() : []);
            }
          } catch (e) {
            if (!cancelled) setDemoUsers([]);
          }
        } else if (!cancelled) {
          setDemoUsers([]);
        }
      } catch (e) {
        // Banner user info is best-effort; pages surface their own errors.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeInitialized]);

  const onSwitchUser = React.useCallback(
    async (userid) => {
      const u = safeTrim(userid);
      if (!u) return;
      try {
        const resp = await putJson("/api/v1/current-user", { user: u });
        setCurrentUserInfo(resp && typeof resp === "object" ? resp : {});
      } catch (e) {
        setError(formatError(e));
      }
    },
    [setError]
  );

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

  const sortedProductEnvOptions = React.useMemo(() => {
    const orderByName = {};
    (infraEnvItems || []).forEach((it) => {
      const n = safeTrim(it?.name);
      const o = parseInt(String(it?.data?.uidisplayorder ?? ""), 10);
      if (n && Number.isFinite(o) && o >= 1) orderByName[n] = o;
    });
    const list = (productEnvOptions || []).map((x) => safeTrim(x)).filter(Boolean);
    return [...list].sort((a, b) => (orderByName[a] || 0) - (orderByName[b] || 0));
  }, [productEnvOptions, infraEnvItems]);

  React.useEffect(() => {
    if (activeTab !== "products") return;
    if (productSubTab !== "groups" && productSubTab !== "addrs" && productSubTab !== "rules" && productSubTab !== "ip_inventory") return;

    const currentProduct = safeTrim(window.__fwCurrentProduct) || getProductFromPath(window.location.pathname);
    if (!isNonEmptyString(currentProduct)) return;

    const envFromPath = getProductEnvFromPath(window.location.pathname);
    const envNames = (sortedProductEnvOptions || []).length ? sortedProductEnvOptions : [];
    if (envNames.length === 0) return;

    const preferred = safeTrim(envFromPath) || safeTrim(productEnv) || (envNames.length ? envNames[0] : "");
    if (!preferred) return;
    if (!safeTrim(productEnv) || safeTrim(productEnv) !== preferred) {
      setProductEnv(preferred);
    }

    const expected = `/products/${encodeURIComponent(currentProduct)}/${encodeURIComponent(productSubTab)}/${encodeURIComponent(preferred)}`;
    const pn = String(window.location.pathname || "");
    const allowed = pn === expected || pn === `${expected}/add` || pn === `${expected}/edit`;
    if (!allowed) {
      window.history.replaceState({}, "", expected);
      setRouteVersion((v) => v + 1);
    }
  }, [activeTab, productSubTab, productEnv, infraEnvItems, productEnvOptions, sortedProductEnvOptions, getProductFromPath, getProductEnvFromPath]);

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

      const subTabs = (
        <div className="card" style={{ padding: 12 }}>
          <div className="actions" style={{ marginTop: 0, justifyContent: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                className="btn"
                style={{ background: "rgba(108,117,125,0.15)", borderColor: "rgba(108,117,125,0.45)", color: "#495057" }}
                onClick={() => {
                  if (typeof setCurrentProduct === "function") setCurrentProduct("");
                  if (window.__fwCurrentProduct) window.__fwCurrentProduct = "";
                  if (`${window.location.pathname}${window.location.search}` !== "/products") {
                    window.history.pushState({}, "", "/products");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }
                }}
              >
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to Products
                </span>
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
                className={`tab ${productSubTab === "groups" ? "active" : ""}`}
                onClick={() => {
                  const envNames = (sortedProductEnvOptions || []).length ? sortedProductEnvOptions : [];
                  const nextEnv = safeTrim(productEnv) || getProductEnvFromPath(window.location.pathname) || (envNames.length ? envNames[0] : "");
                  const nextPath = nextEnv
                    ? `/products/${encodeURIComponent(currentProduct)}/groups/${encodeURIComponent(nextEnv)}`
                    : `/products/${encodeURIComponent(currentProduct)}/groups`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("groups");
                  setProductEnv(nextEnv);
                }}
              >
                groups
              </button>

              <button
                className={`tab ${productSubTab === "addrs" ? "active" : ""}`}
                onClick={() => {
                  const envNames = (sortedProductEnvOptions || []).length ? sortedProductEnvOptions : [];
                  const nextEnv = safeTrim(productEnv) || getProductEnvFromPath(window.location.pathname) || (envNames.length ? envNames[0] : "");
                  const nextPath = nextEnv
                    ? `/products/${encodeURIComponent(currentProduct)}/addrs/${encodeURIComponent(nextEnv)}`
                    : `/products/${encodeURIComponent(currentProduct)}/addrs`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("addrs");
                  setProductEnv(nextEnv);
                }}
              >
                addrs
              </button>

              <button
                className={`tab ${productSubTab === "rules" ? "active" : ""}`}
                onClick={() => {
                  const envNames = (sortedProductEnvOptions || []).length ? sortedProductEnvOptions : [];
                  const nextEnv = safeTrim(productEnv) || getProductEnvFromPath(window.location.pathname) || (envNames.length ? envNames[0] : "");
                  const nextPath = nextEnv
                    ? `/products/${encodeURIComponent(currentProduct)}/rules/${encodeURIComponent(nextEnv)}`
                    : `/products/${encodeURIComponent(currentProduct)}/rules`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("rules");
                  setProductEnv(nextEnv);
                }}
              >
                rules
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
                  setProductEnv("");
                }}
              >
                rule-files
              </button>

              <button
                className={`tab ${productSubTab === "ip_inventory" ? "active" : ""}`}
                onClick={() => {
                  const envNames = (sortedProductEnvOptions || []).length ? sortedProductEnvOptions : [];
                  const nextEnv = safeTrim(productEnv) || getProductEnvFromPath(window.location.pathname) || (envNames.length ? envNames[0] : "");
                  const nextPath = nextEnv
                    ? `/products/${encodeURIComponent(currentProduct)}/ip_inventory/${encodeURIComponent(nextEnv)}`
                    : `/products/${encodeURIComponent(currentProduct)}/ip_inventory`;
                  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                    window.history.pushState({}, "", nextPath);
                  }
                  setProductSubTab("ip_inventory");
                  setProductEnv(nextEnv);
                }}
              >
                ip_inventory
              </button>
            </div>
          </div>

          {productSubTab === "groups" || productSubTab === "addrs" || productSubTab === "rules" || productSubTab === "ip_inventory" ? (
            <div className="actions" style={{ marginTop: 10, justifyContent: "flex-start" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(sortedProductEnvOptions || []).map((envName) => (
                    <button
                      key={envName}
                      className={`tab ${safeTrim(productEnv) === envName ? "active" : ""}`}
                      onClick={() => {
                        const nextPath = `/products/${encodeURIComponent(currentProduct)}/${encodeURIComponent(productSubTab)}/${encodeURIComponent(envName)}`;
                        if (`${window.location.pathname}${window.location.search}` !== nextPath) {
                          window.history.pushState({}, "", nextPath);
                        }
                        setProductEnv(envName);
                      }}
                    >
                      {envName}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      );

      const body = (() => {
        if (productSubTab === "port-protocol") return <PortProtocolTable setLoading={setLoading} setError={setError} />;
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
        return <ComponentsTable setLoading={setLoading} setError={setError} />;
      })();

      return (
        <>
          <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, margin: "4px 0 10px" }}>
            {currentProduct}
          </div>
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
                <button
                  className={`tab ${infraSubTab === "predef-port-protocol" ? "active" : ""}`}
                  onClick={() => {
                    setInfraSubTab("predef-port-protocol");
                    if (window.location.pathname !== "/infra/predef-port-protocol") {
                      window.history.pushState({}, "", "/infra/predef-port-protocol");
                    }
                  }}
                >
                  predef-port-protocol
                </button>
              </div>
            </div>
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
    return <ProductsTable setLoading={setLoading} setError={setError} />;
  }, [activeTab, homeInitialized, onHomeSaved, infraSubTab, productSubTab, productEnv, infraEnvItems, sortedProductEnvOptions, getProductFromPath, getProductEnvFromPath, routeVersion]);

  return (
    <>
      <AppView
        activeTab={homeInitialized === true ? activeTab : "home"}
        homeInitialized={homeInitialized === true}
        onSetTab={(t) => {
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
              const sub = safeTrim(productSubTab) || "components";
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
        }}
        error={error}
        loading={loading}
        demoMode={!!currentUserInfo?.demo_mode}
        currentUser={safeTrim(currentUserInfo?.user || currentUserInfo?.username)}
        demoUsers={demoUsers}
        onSwitchUser={onSwitchUser}
      >
        {content}
      </AppView>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
