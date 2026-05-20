function RoleMgmt({ setLoading, setError }) {
  const [rows, setRows] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [products, setProducts] = React.useState([]);

  const [grantModal, setGrantModal] = React.useState({
    show: false,
    userid: "",
    role: "viewall",
    product: "",
  });

  const productRoles = React.useMemo(() => new Set(["manager", "viewer"]), []);

  const allRoles = React.useMemo(
    () => ["platform_admin", "role_mgmt_admin", "viewall", "manager", "viewer"],
    []
  );

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [uResp, pResp] = await Promise.all([
        fetchJson("/api/v1/role-management/users"),
        listFwConfigItems("products"),
      ]);
      setRows(Array.isArray(uResp?.rows) ? uResp.rows : []);

      const prodNames = (pResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setProducts(prodNames);

      setGrantModal((p) => ({
        ...p,
        product: safeTrim(p?.product) || (prodNames.length ? prodNames[0] : ""),
      }));
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openGrant = React.useCallback(() => {
    setGrantModal((p) => ({
      ...p,
      show: true,
      userid: "",
      role: "viewall",
      product: safeTrim(p?.product) || (products.length ? products[0] : ""),
    }));
  }, [products]);

  const closeGrant = React.useCallback(() => {
    setGrantModal((p) => ({ ...p, show: false }));
  }, []);

  const doGrant = React.useCallback(async () => {
    const userid = safeTrim(grantModal.userid);
    const role = safeTrim(grantModal.role);
    const product = safeTrim(grantModal.product);

    if (!userid) {
      setError("userid is required");
      return;
    }
    if (!role) {
      setError("role is required");
      return;
    }

    try {
      setBusy(true);
      setLoading(true);
      setError("");

      if (productRoles.has(role)) {
        if (!product) throw new Error("product is required for manager/viewer");
        await postJson("/api/v1/role-management/product/assign", { userid, product, role });
      } else {
        await postJson("/api/v1/role-management/userglobal/assign", { user: userid, role });
      }

      closeGrant();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }, [grantModal, productRoles, setLoading, setError, load, closeGrant]);

  const onUngrant = React.useCallback(
    async ({ userid, role, product, scope }) => {
      const u = safeTrim(userid);
      const r = safeTrim(role);
      const p = safeTrim(product);
      const s = safeTrim(scope);
      if (!u || !r) return;

      try {
        setBusy(true);
        setLoading(true);
        setError("");

        if (s === "product" || productRoles.has(r)) {
          await postJson("/api/v1/role-management/product/unassign", { userid: u, product: p, role: r });
        } else {
          await postJson("/api/v1/role-management/userglobal/unassign", { user: u, role: r });
        }

        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
        setBusy(false);
      }
    },
    [productRoles, setLoading, setError, load]
  );

  const canGrant = React.useMemo(() => {
    const userid = safeTrim(grantModal.userid);
    const role = safeTrim(grantModal.role);
    const product = safeTrim(grantModal.product);
    if (!userid || !role) return false;
    if (productRoles.has(role) && !product) return false;
    return true;
  }, [grantModal, productRoles]);

  return (
    <>
      <RoleMgmtView
        rows={rows}
        onRefresh={load}
        onOpenGrant={openGrant}
        onUngrant={onUngrant}
        busy={busy}
      />

      {grantModal.show ? (
        <div className="modalOverlay" onClick={closeGrant}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>Grant role</h3>
              <button className="btn" onClick={closeGrant} disabled={busy}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div className="muted" style={{ marginBottom: 6 }}>
                  Userid
                </div>
                <input
                  className="input"
                  value={String(grantModal.userid || "")}
                  onChange={(e) => setGrantModal((p) => ({ ...p, userid: e.target.value }))}
                  placeholder="userid"
                />
              </div>

              <div>
                <div className="muted" style={{ marginBottom: 6 }}>
                  Role
                </div>
                <select
                  className="input"
                  value={safeTrim(grantModal.role) || ""}
                  onChange={(e) => {
                    const nextRole = safeTrim(e.target.value);
                    setGrantModal((p) => ({
                      ...p,
                      role: nextRole,
                      ...(productRoles.has(nextRole)
                        ? { product: safeTrim(p?.product) || (products.length ? products[0] : "") }
                        : { product: "" }),
                    }));
                  }}
                >
                  {allRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {productRoles.has(safeTrim(grantModal.role)) ? (
                <div>
                  <div className="muted" style={{ marginBottom: 6 }}>
                    Product
                  </div>
                  <select
                    className="input"
                    value={safeTrim(grantModal.product) || ""}
                    onChange={(e) => setGrantModal((p) => ({ ...p, product: e.target.value }))}
                  >
                    {(products || []).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="modalActions">
                <button className="btn" onClick={closeGrant} disabled={busy}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={doGrant} disabled={!canGrant || busy}>
                  Grant
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
