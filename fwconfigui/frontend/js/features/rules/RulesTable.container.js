function RulesTable({ env, setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [envNames, setEnvNames] = React.useState([]);
  const [keywordNames, setKeywordNames] = React.useState([]);
  const [groupOptionsByEnv, setGroupOptionsByEnv] = React.useState({});
  const [editingRule, setEditingRule] = React.useState({
    show: false,
    mode: "edit",
    filename: "",
    appflowid: "",
    originalName: "",
    sourceGroups: [],
    destinationGroups: [],
    ppMap: [],
    businessPurpose: "",
    keywords: [],
  });
  const [yamlEditor, setYamlEditor] = React.useState({ show: false, row: null, name: "", yaml: "" });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });
  const [verifyCommitPanel, setVerifyCommitPanel] = React.useState({ show: false, mode: "verify-only", env: "" });
  const [commitResult, setCommitResult] = React.useState({ show: false, ok: false, errors: [] });

  const rows = React.useMemo(() => {
    return (items || []).map((it) => ({
      ...it,
      filename: safeTrim(it?.filename),
      idx: Number.isFinite(Number(it?.idx)) ? Number(it.idx) : 0,
      data: it?.data && typeof it.data === "object" ? it.data : {},
    }));
  }, [items]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: {
      appflowid: "",
      source: "",
      destination: "",
      protocolPort: "",
      businessPurpose: "",
      inFw: "",
      keywords: "",
      filename: "",
    },
    fieldMapping: (row) => ({
      appflowid: safeTrim(row?.data?.appflowid),
      source: (Array.isArray(row?.data?.["source-list"]) ? row.data["source-list"] : []).join(","),
      destination: (Array.isArray(row?.data?.["destination-list"]) ? row.data["destination-list"] : []).join(","),
      protocolPort: (Array.isArray(row?.data?.["protocol-port-map"]) ? row.data["protocol-port-map"] : [])
        .map((x) => (x && typeof x === "object" ? safeTrim(x["protocol-port"]) : safeTrim(x)))
        .join(","),
      businessPurpose: safeTrim(row?.data?.["business-purpose"]),
      inFw: safeTrim(row?.data?.["IN-FW"]),
      keywords: (Array.isArray(row?.data?.keywords) ? row.data.keywords : []).join(","),
      filename: safeTrim(row?.filename),
    }),
    sortBy: (a, b) => {
      const af = safeTrim(a?.filename).toLowerCase();
      const bf = safeTrim(b?.filename).toLowerCase();
      if (af !== bf) return af.localeCompare(bf);
      const aa = safeTrim(a?.data?.appflowid).toLowerCase();
      const ba = safeTrim(b?.data?.appflowid).toLowerCase();
      if (aa !== ba) return aa.localeCompare(ba);
      return (a?.idx || 0) - (b?.idx || 0);
    },
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [resp, envResp, kwResp, groupOpts] = await Promise.all([
        listRules(env),
        listFwConfigItems("env"),
        listFwConfigItems("keywords"),
        listGroupNameOptions(env),
      ]);
      setItems(resp?.items || []);
      setEnvNames(
        (envResp?.items || []).map((x) => safeTrim(x?.name)).filter(Boolean)
      );
      setKeywordNames(
        (kwResp?.items || []).map((x) => safeTrim(x?.name)).filter(Boolean)
      );
      const e = safeTrim(env);
      setGroupOptionsByEnv((p) => ({ ...p, [e]: Array.isArray(groupOpts) ? groupOpts : [] }));
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [env, setLoading, setError]);

  React.useEffect(() => {
    load();
  }, [load]);

  const requestEnvGroups = React.useCallback(
    async (envName) => {
      const e = safeTrim(envName);
      if (!e || (groupOptionsByEnv || {})[e]) return;
      try {
        const opts = await listGroupNameOptions(e);
        setGroupOptionsByEnv((p) => ({ ...p, [e]: Array.isArray(opts) ? opts : [] }));
      } catch (err) {
        setError(formatError(err));
      }
    },
    [groupOptionsByEnv, setError]
  );

  const openEditForm = React.useCallback((row) => {
    const d = row?.data || {};
    setEditingRule({
      show: true,
      mode: "edit",
      filename: safeTrim(row?.filename),
      appflowid: safeTrim(d.appflowid),
      originalName: safeTrim(d.appflowid),
      sourceGroups: (Array.isArray(d["source-list"]) ? d["source-list"] : []).map((x) => safeTrim(x)).filter(Boolean),
      destinationGroups: (Array.isArray(d["destination-list"]) ? d["destination-list"] : []).map((x) => safeTrim(x)).filter(Boolean),
      ppMap: (Array.isArray(d["protocol-port-map"]) ? d["protocol-port-map"] : []).map((x) =>
        x && typeof x === "object"
          ? { "protocol-port": safeTrim(x["protocol-port"]), service_offered: safeTrim(x.service_offered) }
          : { "protocol-port": safeTrim(x), service_offered: "" }
      ),
      businessPurpose: safeTrim(d["business-purpose"]),
      keywords: (Array.isArray(d.keywords) ? d.keywords : []).map((x) => safeTrim(x)).filter(Boolean),
    });
  }, []);

  const rulesListPath = React.useCallback(() => {
    const product = safeTrim(getCurrentProduct());
    const e = safeTrim(env);
    if (product && e) return `/products/${encodeURIComponent(product)}/rules/${encodeURIComponent(e)}`;
    if (product) return `/products/${encodeURIComponent(product)}/rules`;
    return "/rules";
  }, [env]);

  const pushPathIfChanged = React.useCallback((nextPath) => {
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, []);

  const onEdit = React.useCallback((row) => openEditForm(row), [openEditForm]);

  const onAdd = React.useCallback(() => {
    setEditingRule({
      show: true,
      mode: "add",
      filename: "fw-rules.yaml",
      appflowid: "",
      originalName: "",
      sourceGroups: [],
      destinationGroups: [],
      ppMap: [],
      businessPurpose: "",
      keywords: [],
    });
    pushPathIfChanged(`${rulesListPath()}/add`);
  }, [rulesListPath, pushPathIfChanged]);

  const onBackFromEdit = React.useCallback(() => {
    setEditingRule((p) => ({ ...p, show: false }));
    pushPathIfChanged(rulesListPath());
  }, [rulesListPath, pushPathIfChanged]);

  React.useEffect(() => {
    const syncEditorToPath = () => {
      const path = String(window.location.pathname || "");
      if (!path.endsWith("/add") && !path.endsWith("/edit")) {
        setEditingRule((p) => (p.show ? { ...p, show: false } : p));
      }
    };
    window.addEventListener("popstate", syncEditorToPath);
    window.addEventListener("locationchange", syncEditorToPath);
    return () => {
      window.removeEventListener("popstate", syncEditorToPath);
      window.removeEventListener("locationchange", syncEditorToPath);
    };
  }, []);

  const canSubmitEdit = React.useMemo(() => {
    return isNonEmptyString(editingRule.appflowid) && isNonEmptyString(editingRule.filename);
  }, [editingRule]);

  const onSaveEdit = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const name = safeTrim(editingRule.appflowid);
      if (!name) {
        setError("appflowid is required");
        return;
      }
      const data = {
        name,
        "source-list": (Array.isArray(editingRule.sourceGroups) ? editingRule.sourceGroups : [])
          .map((g) => safeTrim(g))
          .filter(Boolean)
          .map((g) => ({ group: g })),
        "destination-list": (Array.isArray(editingRule.destinationGroups) ? editingRule.destinationGroups : [])
          .map((g) => safeTrim(g))
          .filter(Boolean)
          .map((g) => ({ group: g })),
        "protocol-port-map": (Array.isArray(editingRule.ppMap) ? editingRule.ppMap : [])
          .map((x) => ({ "protocol-port": safeTrim(x?.["protocol-port"]), service_offered: safeTrim(x?.service_offered) }))
          .filter((x) => x["protocol-port"]),
        "business-purpose": safeTrim(editingRule.businessPurpose),
        keywords: (Array.isArray(editingRule.keywords) ? editingRule.keywords : [])
          .map((x) => safeTrim(x))
          .filter(Boolean),
      };
      const filename = safeTrim(editingRule.filename) || "fw-rules.yaml";
      if (safeTrim(editingRule.mode) === "add") {
        await saveRule(env, { filename, name, data });
      } else {
        await updateRule(env, {
          filename,
          name,
          original_name: editingRule.originalName,
          data,
        });
      }
      setEditingRule((p) => ({ ...p, show: false }));
      pushPathIfChanged(rulesListPath());
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [editingRule, env, setLoading, setError, load, rulesListPath, pushPathIfChanged]);

  function extractLockedNameFromYaml(yamlText, fallbackName) {
    const lines = String(yamlText || "").split(/\r?\n/);
    let name = safeTrim(fallbackName);
    for (const ln of lines) {
      const m = ln.match(/^\s*(?:name|appflowid)\s*:\s*(.+?)\s*$/);
      if (m) {
        name = safeTrim(m[1]).replace(/^['"]|['"]$/g, "");
        break;
      }
    }
    return { name, yamlBody: removeAnyNameLines(yamlText) };
  }

  function removeAnyNameLines(yamlText) {
    return String(yamlText || "")
      .split(/\r?\n/)
      .filter((ln) => !/^\s*(?:name|appflowid)\s*:/.test(ln))
      .join("\n")
      .replace(/^\n+/, "");
  }

  const onEditYaml = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");
        const filename = safeTrim(row?.filename);
        const appflowid = safeTrim(row?.data?.appflowid);
        const res = await getRuleYaml(env, filename, appflowid);
        const extracted = extractLockedNameFromYaml(String(res?.yaml || ""), appflowid);
        setYamlEditor({ show: true, row, name: extracted.name, yaml: extracted.yamlBody });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [env, setLoading, setError]
  );

  const onSaveYaml = React.useCallback(async () => {
    const row = yamlEditor.row;
    try {
      setLoading(true);
      setError("");
      const filename = safeTrim(row?.filename);
      const appflowid = safeTrim(row?.data?.appflowid);
      const locked = safeTrim(yamlEditor.name) || safeTrim(appflowid);
      const body = removeAnyNameLines(yamlEditor.yaml);
      const finalYaml = `name: ${locked}\n${String(body || "").replace(/^\n+/, "")}`;
      await putRuleYaml(env, filename, appflowid, finalYaml);
      setYamlEditor({ show: false, row: null, name: "", yaml: "" });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [yamlEditor, env, setLoading, setError, load]);

  const generateCopyName = React.useCallback(
    (base) => {
      const existing = new Set((items || []).map((it) => safeTrim(it?.data?.appflowid).toUpperCase()).filter(Boolean));
      const stem = safeTrim(base) || "RULE";
      for (let i = 1; i <= 999; i++) {
        const candidate = i === 1 ? `${stem}-COPY` : `${stem}-COPY${i}`;
        if (!existing.has(candidate.toUpperCase())) return candidate;
      }
      return `${stem}-COPY${Date.now()}`;
    },
    [items]
  );

  const onCopy = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");
        const d = row?.data || {};
        const newName = generateCopyName(d.appflowid);
        const filename = safeTrim(row?.filename) || "fw-rules.yaml";
        const data = {
          name: newName,
          "source-list": (Array.isArray(d["source-list"]) ? d["source-list"] : []).map((g) => ({ group: g })),
          "destination-list": (Array.isArray(d["destination-list"]) ? d["destination-list"] : []).map((g) => ({
            group: g,
          })),
          "protocol-port-map": (Array.isArray(d["protocol-port-map"]) ? d["protocol-port-map"] : []).map((x) =>
            x && typeof x === "object"
              ? { "protocol-port": safeTrim(x["protocol-port"]), service_offered: safeTrim(x.service_offered) }
              : { "protocol-port": safeTrim(x), service_offered: "" }
          ),
          "business-purpose": safeTrim(d["business-purpose"]),
          keywords: Array.isArray(d.keywords) ? [...d.keywords] : [],
        };
        await saveRule(env, { filename, name: newName, data });
        await load();
        openEditForm({ filename, data: { ...d, appflowid: newName } });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [env, generateCopyName, setLoading, setError, load, openEditForm]
  );

  const runVerifyAndCommit = React.useCallback(
    async (mode, envName) => {
      try {
        setLoading(true);
        setError("");
        const selectedEnv = safeTrim(envName);
        const envs = selectedEnv ? [selectedEnv] : [];
        const res = await postJson(`${fwconfigTypeBasePath("fw-rules")}/verify_and_commit`, { mode, envs });
        const ok = !!res?.ok;
        const errors = Array.isArray(res?.errors) ? res.errors : [];
        setCommitResult({ show: true, ok, errors });
        if (!ok && errors.length) {
          setError(String(errors[0] || "Validation failed"));
        }
      } catch (e) {
        setError(formatError(e));
        setCommitResult({ show: true, ok: false, errors: [formatError(e)] });
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  const onCommit = React.useCallback(() => {
    setVerifyCommitPanel({ show: true, mode: "verify-only", env: safeTrim(env) });
  }, [env]);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteRule(env, { filename: row.filename, name: safeTrim(row?.data?.appflowid) });
      setConfirmDelete({ show: false, row: null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [confirmDelete, env, setLoading, setError, load]);

  const closeYamlEditor = React.useCallback(
    () => setYamlEditor({ show: false, row: null, name: "", yaml: "" }),
    []
  );

  if (editingRule.show) {
    return (
      <RuleDetailsView
        env={env}
        form={editingRule}
        setForm={setEditingRule}
        canSubmit={canSubmitEdit}
        onBack={onBackFromEdit}
        onSave={onSaveEdit}
        envNames={envNames}
        groupOptionsByEnv={groupOptionsByEnv}
        onRequestEnvGroups={requestEnvGroups}
        keywordNames={keywordNames}
      />
    );
  }

  return (
    <>
      <RulesTableView
        env={env}
        rows={sortedRows}
        filters={filters}
        setFilters={setFilters}
        onCommit={onCommit}
        onAdd={onAdd}
        onEdit={onEdit}
        onEditYaml={onEditYaml}
        onCopy={onCopy}
        onDelete={onDelete}
      />

      {verifyCommitPanel.show ? (
        <div
          className="modalOverlay"
          onClick={(e) =>
            e.target === e.currentTarget && setVerifyCommitPanel({ show: false, mode: "verify-only", env: "" })
          }
        >
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>Verify and commit</h3>
              <button className="btn" onClick={() => setVerifyCommitPanel({ show: false, mode: "verify-only", env: "" })}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  name="verify-commit-mode"
                  checked={safeTrim(verifyCommitPanel.mode) === "verify-only"}
                  onChange={() => setVerifyCommitPanel((p) => ({ ...p, mode: "verify-only" }))}
                />
                <span>Verify-only</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  name="verify-commit-mode"
                  checked={safeTrim(verifyCommitPanel.mode) === "verify-and-commit"}
                  onChange={() => setVerifyCommitPanel((p) => ({ ...p, mode: "verify-and-commit" }))}
                />
                <span>Verify and commit</span>
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ minWidth: 48 }}>Envs</span>
                <select
                  value={safeTrim(verifyCommitPanel.env)}
                  onChange={(e) => setVerifyCommitPanel((p) => ({ ...p, env: e.target.value }))}
                >
                  <option value="" disabled>
                    Select environment
                  </option>
                  {(Array.isArray(envNames) ? envNames : []).map((e) => {
                    const v = safeTrim(e);
                    if (!v) return null;
                    return (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>

            <div className="modalActions">
              <button className="btn" onClick={() => setVerifyCommitPanel({ show: false, mode: "verify-only", env: "" })}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!safeTrim(verifyCommitPanel.env)}
                onClick={async () => {
                  const mode = safeTrim(verifyCommitPanel.mode) || "verify-only";
                  const selectedEnv = safeTrim(verifyCommitPanel.env);
                  if (!selectedEnv) return;
                  setVerifyCommitPanel({ show: false, mode: "verify-only", env: "" });
                  await runVerifyAndCommit(mode, selectedEnv);
                }}
              >
                Run
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {commitResult.show ? (
        <div
          className="modalOverlay"
          onClick={(e) =>
            e.target === e.currentTarget && setCommitResult({ show: false, ok: false, errors: [] })
          }
        >
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>Commit validation</h3>
              <button className="btn" onClick={() => setCommitResult({ show: false, ok: false, errors: [] })}>
                Close
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              {commitResult.ok ? (
                <div style={{ color: "#1f7a35" }}>Validation passed.</div>
              ) : (
                <div style={{ color: "#dc3545" }}>Validation failed.</div>
              )}
            </div>

            {!commitResult.ok ? (
              <div style={{ marginTop: 12 }}>
                <div className="muted" style={{ marginBottom: 6 }}>
                  Errors ({Array.isArray(commitResult.errors) ? commitResult.errors.length : 0})
                </div>
                <div style={{ maxHeight: 360, overflow: "auto" }}>
                  {(commitResult.errors || []).map((msg, idx) => (
                    <div
                      key={idx}
                      className="card"
                      style={{ padding: 10, marginBottom: 8, borderColor: "rgba(220,53,69,0.35)" }}
                    >
                      {String(msg || "")}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {yamlEditor.show ? (
        <div className="modalOverlay" onClick={(e) => e.target === e.currentTarget && closeYamlEditor()}>
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>Edit YAML</h3>
              <button className="btn" onClick={closeYamlEditor}>
                Close
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <input className="input" value={`name: ${safeTrim(yamlEditor.name)}`} readOnly />
              <textarea
                className="input"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", minHeight: 420 }}
                value={yamlEditor.yaml}
                onChange={(e) => setYamlEditor((p) => ({ ...p, yaml: removeAnyNameLines(e.target.value) }))}
              />
            </div>
            <div className="modalActions">
              <button className="btn" onClick={closeYamlEditor}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onSaveYaml}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        show={confirmDelete.show}
        title="Delete rule"
        message={
          confirmDelete.row
            ? `Delete '${safeTrim(confirmDelete.row?.data?.appflowid)}'${safeTrim(confirmDelete.row.filename) ? ` from ${confirmDelete.row.filename}` : ""}?`
            : ""
        }
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
