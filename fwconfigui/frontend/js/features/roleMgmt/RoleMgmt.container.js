function RoleMgmt({ setLoading, setError }) {
  const [rows, setRows] = React.useState([]);
  const [groupRows, setGroupRows] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [products, setProducts] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState("users");

  const [grantModal, setGrantModal] = React.useState({
    show: false,
    targetType: "",
    targetId: "",
    role: "viewall",
    product: "",
  });
  const [ungrantPopup, setUngrantPopup] = React.useState({ show: false, message: "" });

  const productRoles = React.useMemo(() => new Set(["manager", "viewer"]), []);

  const allRoles = React.useMemo(
    () => ["platform_admin", "viewall", "manager", "viewer"],
    []
  );

  const userOptions = React.useMemo(
    () =>
      (rows || [])
        .map((r) => safeTrim(r?.userid))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const groupOptions = React.useMemo(
    () =>
      (groupRows || [])
        .map((r) => safeTrim(r?.group))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [groupRows]
  );

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [uResp, gResp, pResp] = await Promise.all([
        fetchJson("/api/v1/role-management/users"),
        fetchJson("/api/v1/role-management/groups"),
        listFwConfigItems("products"),
      ]);
      setRows(Array.isArray(uResp?.rows) ? uResp.rows : []);
      setGroupRows(Array.isArray(gResp?.rows) ? gResp.rows : []);

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
      targetType: "",
      targetId: "",
      role: "viewall",
      product: safeTrim(p?.product) || (products.length ? products[0] : ""),
    }));
  }, [products]);

  const closeGrant = React.useCallback(() => {
    setGrantModal((p) => ({ ...p, show: false }));
  }, []);

  const doGrant = React.useCallback(async () => {
    const targetType = safeTrim(grantModal.targetType);
    const targetId = safeTrim(grantModal.targetId);
    const role = safeTrim(grantModal.role);
    const product = safeTrim(grantModal.product);

    if (!targetType) {
      setError("select whether to grant the role to a User or a Group");
      return;
    }
    if (!targetId) {
      setError(targetType === "group" ? "group is required" : "userid is required");
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
        await postJson(
          "/api/v1/role-management/product/assign",
          targetType === "group"
            ? { group: targetId, product, role }
            : { userid: targetId, product, role }
        );
      } else {
        await postJson(
          targetType === "group"
            ? "/api/v1/role-management/groupglobal/assign"
            : "/api/v1/role-management/userglobal/assign",
          targetType === "group" ? { group: targetId, role } : { user: targetId, role }
        );
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
    async ({ userid, group, role, product, scope }) => {
      const u = safeTrim(userid);
      const g = safeTrim(group);
      const r = safeTrim(role);
      const p = safeTrim(product);
      const s = safeTrim(scope);
      if (!r || (!u && !g)) return;

      try {
        setBusy(true);
        setLoading(true);
        setError("");

        if (s === "product" || productRoles.has(r)) {
          await postJson(
            "/api/v1/role-management/product/unassign",
            g ? { group: g, product: p, role: r } : { userid: u, product: p, role: r }
          );
        } else {
          await postJson(
            g ? "/api/v1/role-management/groupglobal/unassign" : "/api/v1/role-management/userglobal/unassign",
            g ? { group: g, role: r } : { user: u, role: r }
          );
        }

        await load();
      } catch (e) {
        setUngrantPopup({ show: true, message: formatError(e) });
      } finally {
        setLoading(false);
        setBusy(false);
      }
    },
    [productRoles, setLoading, setError, load]
  );

  const canGrant = React.useMemo(() => {
    const targetType = safeTrim(grantModal.targetType);
    const targetId = safeTrim(grantModal.targetId);
    const role = safeTrim(grantModal.role);
    const product = safeTrim(grantModal.product);
    if (!targetType || !targetId || !role) return false;
    if (productRoles.has(role) && !product) return false;
    return true;
  }, [grantModal, productRoles]);

  const grantTargetOptions = safeTrim(grantModal.targetType) === "group" ? groupOptions : userOptions;

  return (
    <>
      <RoleMgmtView
        rows={rows}
        groupRows={groupRows}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={load}
        onOpenGrant={openGrant}
        onUngrant={onUngrant}
        busy={busy}
      />

      <ConfirmationModal
        show={ungrantPopup.show}
        title="Ungrant role"
        message={ungrantPopup.message}
        onClose={() => setUngrantPopup({ show: false, message: "" })}
        onConfirm={() => setUngrantPopup({ show: false, message: "" })}
        confirmText="OK"
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
                  Grant role to
                </div>
                <select
                  className="input"
                  value={safeTrim(grantModal.targetType) || ""}
                  onChange={(e) =>
                    setGrantModal((p) => ({ ...p, targetType: safeTrim(e.target.value), targetId: "" }))
                  }
                >
                  <option value="" disabled>
                    Select one
                  </option>
                  <option value="user">User</option>
                  <option value="group">Group</option>
                </select>
              </div>

              {safeTrim(grantModal.targetType) ? (
                <div>
                  <div className="muted" style={{ marginBottom: 6 }}>
                    {safeTrim(grantModal.targetType) === "group" ? "Groupid" : "Userid"}
                  </div>
                  <select
                    className="input"
                    value={safeTrim(grantModal.targetId) || ""}
                    onChange={(e) => setGrantModal((p) => ({ ...p, targetId: e.target.value }))}
                  >
                    <option value="" disabled>
                      Select {safeTrim(grantModal.targetType) === "group" ? "group" : "user"}
                    </option>
                    {grantTargetOptions.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

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
