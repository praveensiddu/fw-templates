function MultiSelectPicker({
  options,
  values,
  onChange,
  placeholder,
  inputTestId,
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  const normalizedOptions = Array.isArray(options) ? options : [];
  const selected = Array.isArray(values) ? values : [];

  const filteredOptions = React.useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((x) => String(x).toLowerCase().includes(q));
  }, [normalizedOptions, query]);

  React.useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e) => {
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function addValue(name) {
    const v = String(name || "").trim();
    if (!v) return;
    const exists = selected.some((x) => String(x).toLowerCase() === v.toLowerCase());
    const nextList = exists ? selected : [...selected, v];
    onChange(nextList);
    setQuery("");
    setOpen(true);
  }

  function removeValue(name) {
    const v = String(name || "").trim();
    if (!v) return;
    const nextList = selected.filter((x) => String(x).toLowerCase() !== v.toLowerCase());
    onChange(nextList);
  }

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", flex: 1 }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div
        className="filterInput"
        style={{
          minHeight: 36,
          height: "auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          padding: "6px 8px",
        }}
        onMouseDown={() => setOpen(true)}
      >
        {(selected || []).map((c) => (
          <span
            key={c}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.06)",
              fontSize: 12,
            }}
          >
            <span>{c}</span>
            <button
              type="button"
              className="btn"
              style={{ padding: "0 6px", lineHeight: "16px" }}
              onClick={() => removeValue(c)}
              aria-label={`Remove ${c}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="filterInput"
          style={{
            border: "none",
            outline: "none",
            boxShadow: "none",
            flex: 1,
            minWidth: 160,
            padding: 0,
            margin: 0,
            height: 22,
          }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const first = filteredOptions[0];
              if (first) addValue(first);
              return;
            }
            if (e.key === "Backspace" && !query && (selected || []).length > 0) {
              const last = (selected || [])[(selected || []).length - 1];
              removeValue(last);
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          data-testid={inputTestId}
        />
      </div>

      {open ? (
        <div
          style={{
            position: "absolute",
            zIndex: 10001,
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 8,
            maxHeight: 220,
            overflow: "auto",
          }}
          tabIndex={-1}
        >
          {filteredOptions.length === 0 ? (
            <div className="muted" style={{ padding: 10 }}>
              No matches
            </div>
          ) : (
            filteredOptions.map((c) => (
              <button
                key={c}
                type="button"
                className="btn"
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderRadius: 0,
                  padding: "10px 10px",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addValue(c);
                }}
              >
                {c}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function FwRulesTable({ setLoading, setError }) {
  const [items, setItems] = React.useState([]);
  const [portProtocolNames, setPortProtocolNames] = React.useState([]);
  const [portProtocolDisplayByName, setPortProtocolDisplayByName] = React.useState({});
  const [businessPurposeNames, setBusinessPurposeNames] = React.useState([]);
  const [businessPurposeDisplayByName, setBusinessPurposeDisplayByName] = React.useState({});
  const [envNames, setEnvNames] = React.useState([]);
  const [keywordNames, setKeywordNames] = React.useState([]);
  const [ruleFileNames, setRuleFileNames] = React.useState([]);
  const [componentItems, setComponentItems] = React.useState([]);
  const [cellEdit, setCellEdit] = React.useState({
    key: "",
    row: null,
    field: "", // protocol-port-reference | business-purpose-reference | keywords | envs
    businessPurpose: "",
    protocolPortRefs: [],
    keywords: [],
    envs: [],
  });

  const groupOptions = React.useMemo(() => {
    const seen = new Set();
    const out = [];

    for (const it of Array.isArray(componentItems) ? componentItems : []) {
      const comp = safeTrim(it?.name);
      const sites = it?.data?.sites && typeof it.data.sites === "object" ? it.data.sites : {};
      if (!comp) continue;

      for (const envKey of Object.keys(sites || {})) {
        const lst = Array.isArray(sites?.[envKey]) ? sites[envKey] : [];
        for (const s of lst) {
          const site = safeTrim(s);
          if (!site) continue;
          const val = `${site}-${comp}-<env-suffix>`;
          if (seen.has(val)) continue;
          seen.add(val);
          out.push(val);
        }
      }
    }

    return out.sort((a, b) => String(a).localeCompare(String(b)));
  }, [componentItems]);
  const [activePage, setActivePage] = React.useState("list");
  const [detailsMode, setDetailsMode] = React.useState("add");
  const [isEditingSource, setIsEditingSource] = React.useState(false);
  const [isEditingDestination, setIsEditingDestination] = React.useState(false);
  const [savedSourceItems, setSavedSourceItems] = React.useState([]);
  const [savedDestinationItems, setSavedDestinationItems] = React.useState([]);
  const [form, setForm] = React.useState({
    filename: "fw-rules.yaml",
    appflowid: "",
    sourceItems: [],
    destinationItems: [],
    businessPurpose: "",
    protocolPortRefs: [],
    keywords: [],
    envs: [],
  });
  const [confirmDelete, setConfirmDelete] = React.useState({ show: false, row: null });
  const [yamlEditor, setYamlEditor] = React.useState({ show: false, row: null, appflowid: "", yaml: "" });
  const [commitResult, setCommitResult] = React.useState({ show: false, ok: false, errors: [] });
  const [originalAppflowid, setOriginalAppflowid] = React.useState("");

  function stableStringify(v) {
    const seen = new WeakSet();
    const walk = (x) => {
      if (x === null || typeof x !== "object") return x;
      if (seen.has(x)) return null;
      seen.add(x);
      if (Array.isArray(x)) return x.map(walk);
      const keys = Object.keys(x).sort();
      const out = {};
      for (const k of keys) out[k] = walk(x[k]);
      return out;
    };
    return JSON.stringify(walk(v));
  }

  const initialDetailsSnapshotRef = React.useRef("");

  const createNewAppFlowId = React.useCallback(() => {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, "0");
    const mm = pad2(now.getMonth() + 1);
    const dd = pad2(now.getDate());
    const yy = pad2(now.getFullYear() % 100);
    const hh = pad2(now.getHours());
    const min = pad2(now.getMinutes());
    const ss = pad2(now.getSeconds());
    const rand = pad2(Math.floor(Math.random() * 100));
    return `${mm}${dd}${yy}T${hh}${min}${ss}_${rand}`;
  }, []);

  function extractLockedAppflowIdFromYaml(yamlText, fallbackAppflowid) {
    const lines = String(yamlText || "").split(/\r?\n/);
    let locked = safeTrim(fallbackAppflowid);
    const nextLines = [];

    for (const line of lines) {
      const m = String(line).match(/^\s*appflowid\s*:\s*(.*)\s*$/i);
      if (m) {
        const rawVal = safeTrim(m[1]);
        if (rawVal) locked = rawVal;
        continue;
      }
      nextLines.push(line);
    }

    return {
      appflowid: locked,
      yamlBody: nextLines.join("\n").replace(/^\n+/, ""),
    };
  }

  function removeAnyAppflowIdLines(yamlText) {
    return String(yamlText || "")
      .split(/\r?\n/)
      .filter((l) => !/^\s*appflowid\s*:/i.test(String(l)))
      .join("\n");
  }

  const endpointEnvOptions = React.useMemo(() => {
    const list = Array.isArray(form?.envs) ? form.envs : [];
    return list.map((x) => safeTrim(x)).filter(Boolean);
  }, [form?.envs]);

  const hasUnsavedDetailsChanges = React.useCallback(() => {
    if (activePage !== "details") return false;
    const snap = initialDetailsSnapshotRef.current;
    if (!snap) return false;
    return stableStringify(form) !== snap;
  }, [activePage, form]);

  React.useEffect(() => {
    setForm((p) => {
      const allowed = new Set(endpointEnvOptions.map((x) => String(x).toLowerCase()));

      const pruneItems = (items) => {
        const list = Array.isArray(items) ? items : [];
        return list.map((it) => {
          const envs = Array.isArray(it?.envs)
            ? it.envs.filter((e) => allowed.has(String(e).toLowerCase()))
            : [];
          return { ...(it || {}), envs };
        });
      };

      const nextSourceItems = pruneItems(p?.sourceItems);
      const nextDestinationItems = pruneItems(p?.destinationItems);

      return { ...p, sourceItems: nextSourceItems, destinationItems: nextDestinationItems };
    });
  }, [endpointEnvOptions]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [fwResp, ppResp, bpResp, envResp, kwResp, rfResp, compResp] = await Promise.all([
        listFwConfigItems("fw-rules"),
        listFwConfigItems("port-protocol"),
        listFwConfigItems("business-purpose"),
        listFwConfigItems("env"),
        listFwConfigItems("keywords"),
        listFwConfigItems("rule-files"),
        listFwConfigItems("components"),
      ]);

      setItems(fwResp?.items || []);

      const ppNames = (ppResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setPortProtocolNames(ppNames);

      const ppDisplay = (ppResp?.items || []).reduce((acc, it) => {
        const n = safeTrim(it?.name);
        const pp = it?.data?.["port-protocol"];
        const port = safeTrim(pp?.port);
        const service = safeTrim(pp?.service);
        if (n) {
          const display = port && service ? `${port}-${service}` : port || service || n;
          acc[n] = display;
        }
        return acc;
      }, {});
      setPortProtocolDisplayByName(ppDisplay);

      const bpNames = (bpResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setBusinessPurposeNames(bpNames);

      const bpDisplay = (bpResp?.items || []).reduce((acc, it) => {
        const n = safeTrim(it?.name);
        const bp = safeTrim(it?.data?.["business-purpose"]);
        if (n) {
          acc[n] = bp || n;
        }
        return acc;
      }, {});
      setBusinessPurposeDisplayByName(bpDisplay);

      const envs = (envResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setEnvNames(envs);

      const kws = (kwResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setKeywordNames(kws);

      const ruleFiles = (rfResp?.items || [])
        .map((x) => safeTrim(x?.name))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setRuleFileNames(ruleFiles);

      setComponentItems(compResp?.items || []);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  React.useEffect(() => {
    load();
  }, [load]);

  const formatEndpoint = React.useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "";
    return arr
      .map((it) => {
        const group = safeTrim(it?.group);
        const envs = Array.isArray(it?.envs) ? it.envs.map((x) => safeTrim(x)).filter(Boolean) : [];
        const envsPart = envs.length ? `[${envs.join(",")}]` : "[]";
        if (!group) return envsPart;
        return `${group} ${envsPart}`;
      })
      .filter(Boolean)
      .join("\n");
  }, []);

  const rows = React.useMemo(() => {
    return (items || []).map((it) => {
      const refs = Array.isArray(it?.data?.["protocol-port-reference"]) ? it.data["protocol-port-reference"] : [];
      const src = it?.data?.["source-list"] || it?.data?.source;
      const dst = it?.data?.["destination-list"] || it?.data?.destination;
      const keywords = Array.isArray(it?.data?.keywords) ? it.data.keywords : [];
      const envs = Array.isArray(it?.data?.envs) ? it.data.envs : [];
      const bpRef = safeTrim(it?.data?.["business-purpose-reference"]);
      const appflowid = safeTrim(it?.data?.appflowid);
      return {
        ...it,
        name: safeTrim(it?.name) || appflowid,
        appflowid,
        sourceDisplay: formatEndpoint(src),
        destinationDisplay: formatEndpoint(dst),
        protocolPortDisplay: refs
          .map((r) => {
            const key = safeTrim(r);
            return portProtocolDisplayByName?.[key] || key;
          })
          .filter(Boolean)
          .join("\n"),
        businessPurposeDisplay:
          businessPurposeDisplayByName?.[bpRef] || bpRef,
        keywordsDisplay: keywords.map((x) => safeTrim(x)).filter(Boolean).join("\n"),
        envsJoined: envs.map((x) => safeTrim(x)).filter(Boolean).join("\n"),
      };
    });
  }, [items, formatEndpoint, portProtocolDisplayByName, businessPurposeDisplayByName]);

  const { sortedRows, filters, setFilters } = useTableFilter({
    rows,
    initialFilters: {
      filename: "",
      appflowid: "",
      "source-list": "",
      "destination-list": "",
      ppref: "",
      bp: "",
      keywords: "",
      envs: "",
    },
    fieldMapping: (row) => ({
      filename: safeTrim(row.filename),
      appflowid: safeTrim(row.appflowid),
      "source-list": safeTrim(row.sourceDisplay),
      "destination-list": safeTrim(row.destinationDisplay),
      ppref: safeTrim(row.protocolPortDisplay),
      bp: safeTrim(row.businessPurposeDisplay),
      keywords: safeTrim(row.keywordsDisplay),
      envs: safeTrim(row.envsJoined),
    }),
    sortBy: (a, b) => {
      const aSrc = safeTrim(a?.sourceDisplay).toLowerCase();
      const bSrc = safeTrim(b?.sourceDisplay).toLowerCase();
      const srcCmp = aSrc.localeCompare(bSrc);
      if (srcCmp !== 0) return srcCmp;

      const aDst = safeTrim(a?.destinationDisplay).toLowerCase();
      const bDst = safeTrim(b?.destinationDisplay).toLowerCase();
      const dstCmp = aDst.localeCompare(bDst);
      if (dstCmp !== 0) return dstCmp;

      return safeTrim(a?.appflowid).localeCompare(safeTrim(b?.appflowid));
    },
  });

  const onAdd = React.useCallback(() => {
    const nextAppflowid = createNewAppFlowId();
    const defaultEnvs = ["pac", "prd"];
    setDetailsMode("add");
    setOriginalAppflowid("");
    setIsEditingSource(true);
    setIsEditingDestination(true);
    setForm({
      filename: "fw-rules.yaml",
      appflowid: nextAppflowid,
      sourceItems: [{ group: "", envs: defaultEnvs }],
      destinationItems: [{ group: "", envs: defaultEnvs }],
      businessPurpose: "",
      protocolPortRefs: [],
      keywords: [],
      envs: defaultEnvs,
    });
    initialDetailsSnapshotRef.current = stableStringify({
      filename: "fw-rules.yaml",
      appflowid: nextAppflowid,
      sourceItems: [{ group: "", envs: defaultEnvs }],
      destinationItems: [{ group: "", envs: defaultEnvs }],
      businessPurpose: "",
      protocolPortRefs: [],
      keywords: [],
      envs: defaultEnvs,
    });
    setSavedSourceItems([{ group: "", envs: defaultEnvs }]);
    setSavedDestinationItems([{ group: "", envs: defaultEnvs }]);
    setActivePage("details");

    const p = String(window?.location?.pathname || "");
    const m = p.match(/^\/products\/([^/]+)\//);
    const currentProduct = m ? safeTrim(m[1]) : "";
    const nextPath = currentProduct ? `/products/${encodeURIComponent(currentProduct)}/rule-templates/add` : "/rule-templates/add";
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, [createNewAppFlowId]);

  const onEdit = React.useCallback((row) => {
    setDetailsMode("edit");
    const refs = Array.isArray(row?.data?.["protocol-port-reference"]) ? row.data["protocol-port-reference"] : [];
    const srcItems = Array.isArray(row?.data?.["source-list"])
      ? row.data["source-list"]
      : Array.isArray(row?.data?.source)
        ? row.data.source
        : [];
    const dstItems = Array.isArray(row?.data?.["destination-list"])
      ? row.data["destination-list"]
      : Array.isArray(row?.data?.destination)
        ? row.data.destination
        : [];

    const normalizedSrc = srcItems.map((x) => ({
      group: safeTrim(x?.group),
      envs: Array.isArray(x?.envs) ? x.envs : [],
    }));
    const normalizedDst = dstItems.map((x) => ({
      group: safeTrim(x?.group),
      envs: Array.isArray(x?.envs) ? x.envs : [],
    }));

    const fallbackSrc = normalizedSrc.length ? normalizedSrc : [{ group: "", envs: [] }];
    const fallbackDst = normalizedDst.length ? normalizedDst : [{ group: "", envs: [] }];

    const prevAppflowid = (safeTrim(row?.data?.appflowid) || safeTrim(row?.name))
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");
    setOriginalAppflowid(prevAppflowid);

    setSavedSourceItems(fallbackSrc);
    setSavedDestinationItems(fallbackDst);
    setIsEditingSource(false);
    setIsEditingDestination(false);
    setForm({
      filename: safeTrim(row.filename),
      appflowid: prevAppflowid,
      sourceItems: fallbackSrc,
      destinationItems: fallbackDst,
      protocolPortRefs: refs,
      businessPurpose: safeTrim(row?.data?.["business-purpose-reference"]),
      keywords: Array.isArray(row?.data?.keywords) ? row.data.keywords : [],
      envs: Array.isArray(row?.data?.envs) ? row.data.envs : [],
    });
    initialDetailsSnapshotRef.current = stableStringify({
      filename: safeTrim(row.filename),
      appflowid: prevAppflowid,
      sourceItems: fallbackSrc,
      destinationItems: fallbackDst,
      protocolPortRefs: refs,
      businessPurpose: safeTrim(row?.data?.["business-purpose-reference"]),
      keywords: Array.isArray(row?.data?.keywords) ? row.data.keywords : [],
      envs: Array.isArray(row?.data?.envs) ? row.data.envs : [],
    });
    setActivePage("details");

    const qp = new URLSearchParams();
    qp.set("appflowid", prevAppflowid);
    const p = String(window?.location?.pathname || "");
    const m = p.match(/^\/products\/([^/]+)\//);
    const currentProduct = m ? safeTrim(m[1]) : "";
    const nextPath = currentProduct
      ? `/products/${encodeURIComponent(currentProduct)}/rule-templates/edit?${qp.toString()}`
      : `/rule-templates/edit?${qp.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, []);

  React.useEffect(() => {
    if (activePage !== "list") return;

    const path = String(window.location.pathname || "");
    if (path !== "/rule-templates/edit" && !path.endsWith("/rule-templates/edit")) return;

    const qp = new URLSearchParams(window.location.search || "");
    const appflowid = safeTrim(qp.get("appflowid"));
    if (!appflowid) return;

    const match = (items || []).find((it) => safeTrim(it?.data?.appflowid).toUpperCase() === appflowid.toUpperCase());
    if (match) {
      onEdit(match);
    }
  }, [activePage, items, onEdit]);

  const onDiscardSourceEdits = React.useCallback(() => {
    setForm((p) => ({ ...p, sourceItems: Array.isArray(savedSourceItems) ? savedSourceItems : [] }));
    setIsEditingSource(false);
  }, [savedSourceItems]);

  const onSubmitSourceEdits = React.useCallback(() => {
    const next = Array.isArray(form?.sourceItems) ? form.sourceItems : [];
    setSavedSourceItems(next);
    setIsEditingSource(false);
  }, [form]);

  const onAddSourceItem = React.useCallback(() => {
    setForm((p) => {
      const next = Array.isArray(p?.sourceItems) ? [...p.sourceItems] : [];
      next.push({ group: "", envs: [] });
      return { ...p, sourceItems: next };
    });
  }, []);

  const onRemoveSourceItem = React.useCallback((idx) => {
    setForm((p) => {
      const next = Array.isArray(p?.sourceItems) ? p.sourceItems.filter((_, i) => i !== idx) : [];
      return { ...p, sourceItems: next };
    });
  }, []);

  const onDiscardDestinationEdits = React.useCallback(() => {
    setForm((p) => ({ ...p, destinationItems: Array.isArray(savedDestinationItems) ? savedDestinationItems : [] }));
    setIsEditingDestination(false);
  }, [savedDestinationItems]);

  const onSubmitDestinationEdits = React.useCallback(() => {
    const next = Array.isArray(form?.destinationItems) ? form.destinationItems : [];
    setSavedDestinationItems(next);
    setIsEditingDestination(false);
  }, [form]);

  const onAddDestinationItem = React.useCallback(() => {
    setForm((p) => {
      const next = Array.isArray(p?.destinationItems) ? [...p.destinationItems] : [];
      next.push({ group: "", envs: [] });
      return { ...p, destinationItems: next };
    });
  }, []);

  const onRemoveDestinationItem = React.useCallback((idx) => {
    setForm((p) => {
      const next = Array.isArray(p?.destinationItems) ? p.destinationItems.filter((_, i) => i !== idx) : [];
      return { ...p, destinationItems: next };
    });
  }, []);

  const onDelete = React.useCallback((row) => {
    setConfirmDelete({ show: true, row });
  }, []);

  const onEditYaml = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");
        const filename = safeTrim(row?.filename);
        const appflowid = safeTrim(row?.data?.appflowid) || safeTrim(row?.name);
        const res = await fetchJson(
          `${fwconfigTypeBasePath("fw-rules")}/yaml?filename=${encodeURIComponent(filename)}&appflowid=${encodeURIComponent(appflowid)}`
        );
        const rawYaml = String(res?.yaml || "");
        const extracted = extractLockedAppflowIdFromYaml(rawYaml, appflowid);
        setYamlEditor({ show: true, row, appflowid: extracted.appflowid, yaml: extracted.yamlBody });
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  const onSaveYaml = React.useCallback(async () => {
    const row = yamlEditor.row;
    try {
      setLoading(true);
      setError("");
      const filename = safeTrim(row?.filename);
      const appflowid = safeTrim(row?.data?.appflowid) || safeTrim(row?.name);

      const locked = safeTrim(yamlEditor.appflowid) || safeTrim(appflowid);
      const body = removeAnyAppflowIdLines(yamlEditor.yaml);
      const finalYaml = `appflowid: ${locked}\n${String(body || "").replace(/^\n+/, "")}`;

      await putJson(
        `${fwconfigTypeBasePath("fw-rules")}/yaml?filename=${encodeURIComponent(filename)}&appflowid=${encodeURIComponent(appflowid)}`,
        { yaml_text: finalYaml }
      );
      setYamlEditor({ show: false, row: null, appflowid: "", yaml: "" });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [yamlEditor, setLoading, setError, load]);

  const onCommit = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await postJson(`${fwconfigTypeBasePath("fw-rules")}/commit`, {});
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
  }, [setLoading, setError]);

  const onMoveFile = React.useCallback(
    async (row, nextFilename) => {
      try {
        const fromFilename = safeTrim(row?.filename);
        const toFilename = safeTrim(nextFilename);
        if (!fromFilename || !toFilename || fromFilename === toFilename) return;

        setLoading(true);
        setError("");

        const appflowid = safeTrim(row?.data?.appflowid) || safeTrim(row?.name);
        await putJson(`${fwconfigTypeBasePath("fw-rules")}/move`, {
          appflowid,
          from_filename: fromFilename,
          to_filename: toFilename,
        });

        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, load]
  );

  const onConfirmDelete = React.useCallback(async () => {
    const row = confirmDelete.row;
    try {
      setLoading(true);
      setError("");
      await deleteFwConfigItem("fw-rules", { filename: row.filename, name: safeTrim(row?.data?.appflowid) || row.name });
      setConfirmDelete({ show: false, row: null });
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [confirmDelete, setLoading, setError, load]);

  function generateUniqueAppflowId(existingIds) {
    const existing = new Set((existingIds || []).map((x) => String(x).trim().toLowerCase()));
    for (let i = 0; i < 500; i++) {
      const candidate = createNewAppFlowId();
      if (!existing.has(candidate.toLowerCase())) return candidate;
    }
    return createNewAppFlowId();
  }

  const onCopy = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");

        const allIds = (items || []).map((it) => safeTrim(it?.data?.appflowid)).filter(Boolean);
        const newId = generateUniqueAppflowId(allIds);

        const filename = safeTrim(row?.filename) || "fw-rules.yaml";
        const src = row?.data?.["source-list"] || row?.data?.source;
        const dst = row?.data?.["destination-list"] || row?.data?.destination;
        const refs = Array.isArray(row?.data?.["protocol-port-reference"]) ? row.data["protocol-port-reference"] : [];
        const keywords = Array.isArray(row?.data?.keywords) ? row.data.keywords : [];
        const envs = Array.isArray(row?.data?.envs) ? row.data.envs : [];

        await saveFwConfigItem("fw-rules", {
          filename,
          name: newId,
          data: {
            appflowid: newId,
            "source-list": src,
            "destination-list": dst,
            "protocol-port-reference": refs,
            "business-purpose-reference": safeTrim(row?.data?.["business-purpose-reference"]),
            keywords,
            envs,
          },
        });
        await load();
      } catch (e) {
        setError(formatError(e));
      } finally {
        setLoading(false);
      }
    },
    [items, setLoading, setError, load, createNewAppFlowId]
  );

  const onSave = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const refs = Array.isArray(form.protocolPortRefs)
        ? form.protocolPortRefs.map((x) => safeTrim(x)).filter(Boolean)
        : [];
      const envs = Array.isArray(form.envs) ? form.envs.map((x) => safeTrim(x)).filter(Boolean) : [];

      const keywords = Array.isArray(form.keywords) ? form.keywords.map((x) => safeTrim(x)).filter(Boolean) : [];

      const sourceItems = Array.isArray(form?.sourceItems) ? form.sourceItems : [];
      const destinationItems = Array.isArray(form?.destinationItems) ? form.destinationItems : [];

      const source = sourceItems
        .map((x) => ({
          group: safeTrim(x?.group),
          envs: Array.isArray(x?.envs) ? x.envs.map((e) => safeTrim(e)).filter(Boolean) : [],
        }))
        .filter((x) => isNonEmptyString(x.group) || (Array.isArray(x.envs) && x.envs.length > 0));

      const destination = destinationItems
        .map((x) => ({
          group: safeTrim(x?.group),
          envs: Array.isArray(x?.envs) ? x.envs.map((e) => safeTrim(e)).filter(Boolean) : [],
        }))
        .filter((x) => isNonEmptyString(x.group) || (Array.isArray(x.envs) && x.envs.length > 0));

      const nextAppflowid = safeTrim(form.appflowid)
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "");

      const payload = {
        filename: form.filename,
        name: nextAppflowid,
        original_name: safeTrim(originalAppflowid) || undefined,
        data: {
          appflowid: nextAppflowid,
          "source-list": source,
          "destination-list": destination,
          "protocol-port-reference": refs,
          "business-purpose-reference": safeTrim(form.businessPurpose),
          keywords,
          envs,
        },
      };

      if (detailsMode === "edit") {
        await putJson(fwconfigTypeBasePath("fw-rules"), payload);
      } else {
        await saveFwConfigItem("fw-rules", payload);
      }

      initialDetailsSnapshotRef.current = stableStringify(form);
      setActivePage("list");
      setSavedSourceItems(source);
      setSavedDestinationItems(destination);
      setIsEditingSource(false);
      setIsEditingDestination(false);

      const currentProduct = (function () {
        const p = String(window?.location?.pathname || "");
        const m = p.match(/^\/products\/([^/]+)\//);
        return m ? safeTrim(m[1]) : "";
      })();
      const nextPath = currentProduct ? `/products/${encodeURIComponent(currentProduct)}/rule-templates` : "/rule-templates";
      if (`${window.location.pathname}${window.location.search}` !== nextPath) {
        window.history.pushState({}, "", nextPath);
      }

      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [form, detailsMode, setLoading, setError, load, originalAppflowid]);

  const confirmNavigateAwayFromDetails = React.useCallback(async () => {
    if (!hasUnsavedDetailsChanges()) return true;
    if (typeof window.__fwRulesRequestNavConfirm === "function") {
      return await window.__fwRulesRequestNavConfirm();
    }
    return false;
  }, [hasUnsavedDetailsChanges]);

  React.useEffect(() => {
    window.__fwRulesNavGuard = {
      hasUnsavedChanges: () => hasUnsavedDetailsChanges(),
      save: async () => {
        await onSave();
        return true;
      },
      discard: () => {
        initialDetailsSnapshotRef.current = "";
        setActivePage("list");
        setIsEditingSource(false);
        setIsEditingDestination(false);
        const p = String(window?.location?.pathname || "");
        const m = p.match(/^\/products\/([^/]+)\//);
        const currentProduct = m ? safeTrim(m[1]) : "";
        const nextPath = currentProduct ? `/products/${encodeURIComponent(currentProduct)}/rule-templates` : "/rule-templates";
        if (`${window.location.pathname}${window.location.search}` !== nextPath) {
          window.history.pushState({}, "", nextPath);
        }
      },
    };
    return () => {
      if (window.__fwRulesNavGuard) delete window.__fwRulesNavGuard;
    };
  }, [hasUnsavedDetailsChanges, onSave]);

  const getRowKey = React.useCallback((row) => {
    const filename = safeTrim(row?.filename);
    const appflowid = safeTrim(row?.data?.appflowid) || safeTrim(row?.name);
    return `${filename}::${appflowid}`;
  }, []);

  const onStartCellEdit = React.useCallback(
    (row, field) => {
      const key = getRowKey(row);
      const bp = safeTrim(row?.data?.["business-purpose-reference"]);
      const pp = Array.isArray(row?.data?.["protocol-port-reference"]) ? row.data["protocol-port-reference"] : [];
      const kw = Array.isArray(row?.data?.keywords) ? row.data.keywords : [];
      const envs = Array.isArray(row?.data?.envs) ? row.data.envs : [];
      setCellEdit({
        key,
        row,
        field: safeTrim(field),
        businessPurpose: bp,
        protocolPortRefs: pp,
        keywords: kw,
        envs,
      });
    },
    [getRowKey]
  );

  const onCancelCellEdit = React.useCallback(() => {
    setCellEdit({ key: "", row: null, field: "", businessPurpose: "", protocolPortRefs: [], keywords: [], envs: [] });
  }, []);

  const onSaveCellEdit = React.useCallback(async () => {
    const row = cellEdit.row;
    if (!row) return;
    const appflowid = safeTrim(row?.data?.appflowid) || safeTrim(row?.name);
    if (!appflowid) return;

    try {
      setLoading(true);
      setError("");

      const body = { appflowid };
      const f = safeTrim(cellEdit.field);
      if (f === "protocol-port-reference") {
        body.protocol_port_reference = Array.isArray(cellEdit.protocolPortRefs) ? cellEdit.protocolPortRefs : [];
      } else if (f === "business-purpose-reference") {
        body.business_purpose_reference = safeTrim(cellEdit.businessPurpose);
      } else if (f === "keywords") {
        body.keywords = Array.isArray(cellEdit.keywords) ? cellEdit.keywords : [];
      } else if (f === "envs") {
        body.envs = Array.isArray(cellEdit.envs) ? cellEdit.envs : [];
      } else {
        throw new Error("Unknown field");
      }

      await putJson(`${fwconfigTypeBasePath("fw-rules")}/fields`, body);
      onCancelCellEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [cellEdit, setLoading, setError, load, onCancelCellEdit]);

  return (
    <>
      {activePage === "details" ? (
        <FwRuleDetailsView
          mode={detailsMode}
          form={form}
          setForm={setForm}
          canSubmit={canSubmit}
          onBack={async () => {
            const ok = await confirmNavigateAwayFromDetails();
            if (!ok) return;

            setActivePage("list");
            const p = String(window?.location?.pathname || "");
            const m = p.match(/^\/products\/([^/]+)\//);
            const currentProduct = m ? safeTrim(m[1]) : "";
            const nextPath = currentProduct ? `/products/${encodeURIComponent(currentProduct)}/rule-templates` : "/rule-templates";
            if (`${window.location.pathname}${window.location.search}` !== nextPath) {
              window.history.pushState({}, "", nextPath);
            }
          }}
          onSave={onSave}
          isEditingSource={isEditingSource}
          setIsEditingSource={setIsEditingSource}
          isEditingDestination={isEditingDestination}
          setIsEditingDestination={setIsEditingDestination}
          onDiscardSourceEdits={onDiscardSourceEdits}
          onSubmitSourceEdits={onSubmitSourceEdits}
          onAddSourceItem={onAddSourceItem}
          onRemoveSourceItem={onRemoveSourceItem}
          onDiscardDestinationEdits={onDiscardDestinationEdits}
          onSubmitDestinationEdits={onSubmitDestinationEdits}
          onAddDestinationItem={onAddDestinationItem}
          onRemoveDestinationItem={onRemoveDestinationItem}
          endpointEnvOptions={endpointEnvOptions}
          groupOptions={groupOptions}
          envNames={envNames}
          keywordNames={keywordNames}
          portProtocolNames={portProtocolNames}
          businessPurposeNames={businessPurposeNames}
          ruleFileNames={ruleFileNames}
        />
      ) : (
        <FwRulesTableView
          rows={sortedRows}
          filters={filters}
          setFilters={setFilters}
          onCommit={onCommit}
          onAdd={onAdd}
          onEdit={onEdit}
          onEditYaml={onEditYaml}
          onCopy={onCopy}
          onDelete={onDelete}
          getRowKey={getRowKey}
          cellEdit={cellEdit}
          onStartCellEdit={onStartCellEdit}
          onCancelCellEdit={onCancelCellEdit}
          onSaveCellEdit={onSaveCellEdit}
          setCellEdit={setCellEdit}
          businessPurposeNames={businessPurposeNames}
          keywordNames={keywordNames}
          envNames={envNames}
          portProtocolNames={portProtocolNames}
          MultiSelectPicker={MultiSelectPicker}
          ruleFileNames={ruleFileNames}
          onMoveFile={onMoveFile}
        />
      )}

      {yamlEditor.show ? (
        <div
          className="modalOverlay"
          onClick={(e) =>
            e.target === e.currentTarget && setYamlEditor({ show: false, row: null, appflowid: "", yaml: "" })
          }
        >
          <div className="modalCard">
            <div className="modalHeader">
              <h3 style={{ margin: 0 }}>Edit YAML</h3>
              <button className="btn" onClick={() => setYamlEditor({ show: false, row: null, appflowid: "", yaml: "" })}>
                Close
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <input className="input" value={`appflowid: ${safeTrim(yamlEditor.appflowid)}`} readOnly />
              <textarea
                className="input"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", minHeight: 420 }}
                value={yamlEditor.yaml}
                onChange={(e) => setYamlEditor((p) => ({ ...p, yaml: removeAnyAppflowIdLines(e.target.value) }))}
              />
            </div>
            <div className="modalActions">
              <button className="btn" onClick={() => setYamlEditor({ show: false, row: null, appflowid: "", yaml: "" })}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onSaveYaml}>
                Save
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

      <ConfirmationModal
        show={confirmDelete.show}
        title="Delete item"
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
