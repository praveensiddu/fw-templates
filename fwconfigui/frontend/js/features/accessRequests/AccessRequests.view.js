function AccessRequestsView({
  rows,
  busy,
  onRefresh,
  productForm,
  onProductFormChange,
  onSubmitProduct,
  globalForm,
  onGlobalFormChange,
  onSubmitGlobal,
  products,
  productRoles,
  globalRoles,
  canSubmitProduct,
  canSubmitGlobal,
}) {
  const formatPayload = (payload) => {
    if (!payload || typeof payload !== "object") return "-";
    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  };

  return (
    <>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div className="actions" style={{ marginTop: 0 }}>
          <div className="muted">access requests ({Array.isArray(rows) ? rows.length : 0})</div>
          <button className="btn" onClick={onRefresh} disabled={!!busy}>
            Refresh
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th className="fwTableHeaderCell">ID</th>
              <th className="fwTableHeaderCell">Type</th>
              <th className="fwTableHeaderCell">Status</th>
              <th className="fwTableHeaderCell">Requested By</th>
              <th className="fwTableHeaderCell">Requested At</th>
              <th className="fwTableHeaderCell">Payload</th>
              <th className="fwTableHeaderCell">Granted By</th>
              <th className="fwTableHeaderCell">Granted At</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => {
              const id = safeTrim(r?.id) || safeTrim(r?.request_id);
              return (
                <tr key={id || JSON.stringify(r)}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{id || "-"}</td>
                  <td>{safeTrim(r?.type) || "-"}</td>
                  <td>
                    <span className="pill">{safeTrim(r?.status) || "pending"}</span>
                  </td>
                  <td>{safeTrim(r?.requested_by) || "-"}</td>
                  <td>{safeTrim(r?.requested_at) || "-"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, maxWidth: 280, wordBreak: "break-word" }}>
                    {formatPayload(r?.payload)}
                  </td>
                  <td>{safeTrim(r?.granted_by) || "-"}</td>
                  <td>{safeTrim(r?.granted_at) || "-"}</td>
                </tr>
              );
            })}

            {(rows || []).length === 0 ? (
              <tr>
                <td colSpan={8} className="muted">
                  No access requests
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="accessRequestForms">
        <div className="card" style={{ padding: 12 }}>
          <h3 style={{ margin: "0 0 12px" }}>Request Product Access</h3>
          <div className="accessRequestFormGrid">
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Product
              </div>
              <select
                className="input"
                value={safeTrim(productForm?.product) || ""}
                onChange={(e) => onProductFormChange({ product: e.target.value })}
              >
                {(products || []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Role
              </div>
              <select
                className="input"
                value={safeTrim(productForm?.role) || ""}
                onChange={(e) => onProductFormChange({ role: e.target.value })}
              >
                {(productRoles || []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Userid (optional)
              </div>
              <input
                className="input"
                value={String(productForm?.userid || "")}
                onChange={(e) => onProductFormChange({ userid: e.target.value, group: "" })}
                placeholder="defaults to current user"
              />
            </div>

            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Group (optional)
              </div>
              <input
                className="input"
                value={String(productForm?.group || "")}
                onChange={(e) => onProductFormChange({ group: e.target.value, userid: "" })}
                placeholder="group name"
              />
            </div>
          </div>

          <div className="modalActions" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={onSubmitProduct} disabled={!canSubmitProduct || !!busy}>
              Submit Product Request
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <h3 style={{ margin: "0 0 12px" }}>Request Global Access</h3>
          <div className="accessRequestFormGrid">
            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Role
              </div>
              <select
                className="input"
                value={safeTrim(globalForm?.role) || ""}
                onChange={(e) => onGlobalFormChange({ role: e.target.value })}
              >
                {(globalRoles || []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                User (optional)
              </div>
              <input
                className="input"
                value={String(globalForm?.user || "")}
                onChange={(e) => onGlobalFormChange({ user: e.target.value, group: "" })}
                placeholder="defaults to current user"
              />
            </div>

            <div>
              <div className="muted" style={{ marginBottom: 6 }}>
                Group (optional)
              </div>
              <input
                className="input"
                value={String(globalForm?.group || "")}
                onChange={(e) => onGlobalFormChange({ group: e.target.value, user: "" })}
                placeholder="group name"
              />
            </div>
          </div>

          <div className="modalActions" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={onSubmitGlobal} disabled={!canSubmitGlobal || !!busy}>
              Submit Global Request
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
