function RoleMgmtView({
  rows,
  onRefresh,
  onOpenGrant,
  onUngrant,
  busy,
}) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="actions">
        <div className="muted">role management ({Array.isArray(rows) ? rows.length : 0})</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onRefresh} disabled={!!busy}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={onOpenGrant} disabled={!!busy}>
            Grant Role
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th className="fwTableHeaderCell" style={{ width: 220 }}>
              User
            </th>
            <th className="fwTableHeaderCell">Global Roles</th>
            <th className="fwTableHeaderCell">Product Roles</th>
            <th className="fwTableHeaderCell" style={{ width: 140 }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r, idx) => {
            const user = safeTrim(r?.userid) || `${idx}`;
            const globalRoles = Array.isArray(r?.global_roles) ? r.global_roles : [];
            const productRoles = r?.product_roles && typeof r.product_roles === "object" ? r.product_roles : {};

            const productRolePairs = [];
            Object.keys(productRoles || {}).forEach((p) => {
              const roles = productRoles[p];
              if (!Array.isArray(roles)) return;
              roles.forEach((role) => {
                const rr = safeTrim(role);
                if (!rr) return;
                productRolePairs.push({ product: safeTrim(p), role: rr });
              });
            });

            return (
              <tr key={user}>
                <td style={{ fontWeight: 650 }}>{user}</td>
                <td>
                  {globalRoles.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {globalRoles.map((role) => {
                        const rr = safeTrim(role);
                        return (
                          <span key={rr} className="pill">
                            {rr}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="muted">none</span>
                  )}
                </td>
                <td>
                  {productRolePairs.length ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {productRolePairs.map((pr) => (
                        <div key={`${pr.product}:${pr.role}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span className="pill">{pr.product}</span>
                          <span className="pill">{pr.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">none</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {globalRoles.map((role) => {
                      const rr = safeTrim(role);
                      if (!rr) return null;
                      return (
                        <button
                          key={`g:${rr}`}
                          className="btn"
                          disabled={!!busy}
                          onClick={() => onUngrant({ userid: user, role: rr, scope: "global" })}
                        >
                          Ungrant {rr}
                        </button>
                      );
                    })}

                    {productRolePairs.map((pr) => (
                      <button
                        key={`p:${pr.product}:${pr.role}`}
                        className="btn"
                        disabled={!!busy}
                        onClick={() => onUngrant({ userid: user, role: pr.role, product: pr.product, scope: "product" })}
                      >
                        Ungrant {pr.role}
                      </button>
                    ))}

                    {!globalRoles.length && !productRolePairs.length ? <span className="muted">-</span> : null}
                  </div>
                </td>
              </tr>
            );
          })}

          {(rows || []).length === 0 ? (
            <tr>
              <td colSpan={4} className="muted">
                No users
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
