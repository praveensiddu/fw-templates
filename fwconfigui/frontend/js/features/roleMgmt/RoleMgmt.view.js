function RoleMgmtView({
  rows,
  groupRows,
  activeTab,
  onTabChange,
  onRefresh,
  onOpenGrant,
  onUngrant,
  busy,
}) {
  const renderRolesTable = (items, idKey, nameHeader, emptyText) => (
    <table>
      <thead>
        <tr>
          <th className="fwTableHeaderCell" style={{ width: 220 }}>
            {nameHeader}
          </th>
          <th className="fwTableHeaderCell">Global Roles</th>
          <th className="fwTableHeaderCell">Product Roles</th>
          <th className="fwTableHeaderCell" style={{ width: 140 }}>
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {(items || []).map((r, idx) => {
          const name = safeTrim(r?.[idKey]) || `${idx}`;
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
            <tr key={name}>
              <td style={{ fontWeight: 650 }}>{name}</td>
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
                        onClick={() => onUngrant({ [idKey]: name, role: rr, scope: "global" })}
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
                      onClick={() =>
                        onUngrant({ [idKey]: name, role: pr.role, product: pr.product, scope: "product" })
                      }
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

        {(items || []).length === 0 ? (
          <tr>
            <td colSpan={4} className="muted">
              {emptyText}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );

  const isUsers = safeTrim(activeTab) !== "groups";
  const items = isUsers ? rows : groupRows;

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className={"btn" + (isUsers ? " btn-primary" : "")}
          onClick={() => onTabChange("users")}
        >
          User roles
        </button>
        <button
          className={"btn" + (!isUsers ? " btn-primary" : "")}
          onClick={() => onTabChange("groups")}
        >
          Group roles
        </button>
      </div>

      <div className="actions">
        <div className="muted">
          {isUsers ? "user roles" : "group roles"} ({Array.isArray(items) ? items.length : 0})
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onRefresh} disabled={!!busy}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={onOpenGrant} disabled={!!busy}>
            Grant Role
          </button>
        </div>
      </div>

      {renderRolesTable(items, isUsers ? "userid" : "group", isUsers ? "User" : "Group", isUsers ? "No users" : "No groups")}
    </div>
  );
}
