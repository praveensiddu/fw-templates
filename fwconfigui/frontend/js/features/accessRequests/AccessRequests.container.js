function AccessRequests({ setLoading, setError, routeVersion }) {
  const [rows, setRows] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [products, setProducts] = React.useState([]);

  const productRoles = React.useMemo(() => ["manager", "viewer"], []);
  const globalRoles = React.useMemo(
    () => ["platform_admin", "role_mgmt_admin", "viewall", "manager", "viewer"],
    []
  );

  const [productForm, setProductForm] = React.useState({
    product: "",
    role: "viewer",
    userid: "",
    group: "",
  });

  const [globalForm, setGlobalForm] = React.useState({
    role: "viewall",
    user: "",
    group: "",
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [requests, pResp] = await Promise.all([listAccessRequests(), listFwConfigItems("products")]);
      setRows(Array.isArray(requests) ? requests : []);

      const prodNames = (pResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setProducts(prodNames);

      setProductForm((p) => ({
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
  }, [load, routeVersion]);

  const onProductFormChange = React.useCallback((patch) => {
    setProductForm((p) => ({ ...p, ...(patch || {}) }));
  }, []);

  const onGlobalFormChange = React.useCallback((patch) => {
    setGlobalForm((p) => ({ ...p, ...(patch || {}) }));
  }, []);

  const canSubmitProduct = React.useMemo(() => {
    const product = safeTrim(productForm?.product);
    const role = safeTrim(productForm?.role);
    const userid = safeTrim(productForm?.userid);
    const group = safeTrim(productForm?.group);
    if (!product || !role) return false;
    if (userid && group) return false;
    return true;
  }, [productForm]);

  const canSubmitGlobal = React.useMemo(() => {
    const role = safeTrim(globalForm?.role);
    const user = safeTrim(globalForm?.user);
    const group = safeTrim(globalForm?.group);
    if (!role) return false;
    if (user && group) return false;
    return true;
  }, [globalForm]);

  const onSubmitProduct = React.useCallback(async () => {
    const product = safeTrim(productForm?.product);
    const role = safeTrim(productForm?.role);
    const userid = safeTrim(productForm?.userid);
    const group = safeTrim(productForm?.group);

    if (!product || !role) {
      setError("product and role are required");
      return;
    }
    if (userid && group) {
      setError("Only one of userid or group may be provided");
      return;
    }

    const payload = { product, role };
    if (userid) payload.userid = userid;
    if (group) payload.group = group;

    try {
      setBusy(true);
      setLoading(true);
      setError("");
      await requestProductAccess(payload);
      setProductForm((p) => ({ ...p, userid: "", group: "" }));
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }, [productForm, setLoading, setError, load]);

  const onSubmitGlobal = React.useCallback(async () => {
    const role = safeTrim(globalForm?.role);
    const user = safeTrim(globalForm?.user);
    const group = safeTrim(globalForm?.group);

    if (!role) {
      setError("role is required");
      return;
    }
    if (user && group) {
      setError("Only one of user or group may be provided");
      return;
    }

    const payload = { role };
    if (user) payload.user = user;
    if (group) payload.group = group;

    try {
      setBusy(true);
      setLoading(true);
      setError("");
      await requestGlobalAccess(payload);
      setGlobalForm((p) => ({ ...p, user: "", group: "" }));
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }, [globalForm, setLoading, setError, load]);

  return (
    <AccessRequestsView
      rows={rows}
      busy={busy}
      onRefresh={load}
      productForm={productForm}
      onProductFormChange={onProductFormChange}
      onSubmitProduct={onSubmitProduct}
      globalForm={globalForm}
      onGlobalFormChange={onGlobalFormChange}
      onSubmitGlobal={onSubmitGlobal}
      products={products}
      productRoles={productRoles}
      globalRoles={globalRoles}
      canSubmitProduct={canSubmitProduct}
      canSubmitGlobal={canSubmitGlobal}
    />
  );
}
