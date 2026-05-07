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
  const [inlineEdit, setInlineEdit] = React.useState({
    key: "",
    row: null,
    filename: "",
    businessPurpose: "",
    protocolPortRefs: [],
    keywords: [],
    envs: [],
  });
  const [activePage, setActivePage] = React.useState("list");
  const [detailsMode, setDetailsMode] = React.useState("add");
  const [isEditingSource, setIsEditingSource] = React.useState(false);
  const [isEditingDestination, setIsEditingDestination] = React.useState(false);
  const [savedSourceItems, setSavedSourceItems] = React.useState([]);
  const [savedDestinationItems, setSavedDestinationItems] = React.useState([]);
  const [form, setForm] = React.useState({
    filename: "fw-rules-1.yaml",
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

      const [fwResp, ppResp, bpResp, envResp, kwResp] = await Promise.all([
        listFwConfigItems("fw-rules"),
        listFwConfigItems("port-protocol"),
        listFwConfigItems("business-purpose"),
        listFwConfigItems("env"),
        listFwConfigItems("keywords"),
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
    const first = arr[0];
    const group = safeTrim(first?.group);
    const envs = Array.isArray(first?.envs) ? first.envs.map((x) => safeTrim(x)).filter(Boolean) : [];
    const envsPart = envs.length ? `[${envs.join(",")}]` : "[]";
    if (!group) return envsPart;
    return `${group} ${envsPart}`;
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
          .join(", "),
        businessPurposeDisplay:
          businessPurposeDisplayByName?.[bpRef] || bpRef,
        keywordsDisplay: keywords.map((x) => safeTrim(x)).filter(Boolean).join(", "),
        envsJoined: envs.join(", "),
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
    sortBy: (a, b) => safeTrim(a?.appflowid).localeCompare(safeTrim(b?.appflowid)),
  });

  const onAdd = React.useCallback(() => {
    setDetailsMode("add");
    setIsEditingSource(true);
    setIsEditingDestination(true);
    setForm({
      filename: "fw-rules-1.yaml",
      appflowid: "",
      sourceItems: [{ group: "", envs: [] }],
      destinationItems: [{ group: "", envs: [] }],
      businessPurpose: "",
      protocolPortRefs: [],
      keywords: [],
      envs: [],
    });
    setSavedSourceItems([{ group: "", envs: [] }]);
    setSavedDestinationItems([{ group: "", envs: [] }]);
    setActivePage("details");
  }, []);

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

    setSavedSourceItems(fallbackSrc);
    setSavedDestinationItems(fallbackDst);
    setIsEditingSource(false);
    setIsEditingDestination(false);
    setForm({
      filename: safeTrim(row.filename),
      appflowid: (safeTrim(row?.data?.appflowid) || safeTrim(row?.name)).toUpperCase().replace(/[^A-Z]/g, ""),
      sourceItems: fallbackSrc,
      destinationItems: fallbackDst,
      protocolPortRefs: refs,
      businessPurpose: safeTrim(row?.data?.["business-purpose-reference"]),
      keywords: Array.isArray(row?.data?.keywords) ? row.data.keywords : [],
      envs: Array.isArray(row?.data?.envs) ? row.data.envs : [],
    });
    setActivePage("details");
  }, []);

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
          `/api/v1/fwconfig/fw-rules/yaml?filename=${encodeURIComponent(filename)}&appflowid=${encodeURIComponent(appflowid)}`
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
        `/api/v1/fwconfig/fw-rules/yaml?filename=${encodeURIComponent(filename)}&appflowid=${encodeURIComponent(appflowid)}`,
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

  function generateUniqueAppflowId(existingIds, baseId) {
    const existing = new Set((existingIds || []).map((x) => String(x).trim().toLowerCase()));
    const base = safeTrim(baseId) || "COPY";
    let candidate = `${base}-copy`;
    if (!existing.has(candidate.toLowerCase())) return candidate;
    for (let i = 2; i < 10000; i++) {
      candidate = `${base}-copy-${i}`;
      if (!existing.has(candidate.toLowerCase())) return candidate;
    }
    return `${base}-copy-${Date.now()}`;
  }

  const onCopy = React.useCallback(
    async (row) => {
      try {
        setLoading(true);
        setError("");

        const allIds = (items || []).map((it) => safeTrim(it?.data?.appflowid)).filter(Boolean);
        const currentId = safeTrim(row?.data?.appflowid);
        const newId = generateUniqueAppflowId(allIds, currentId);

        const filename = safeTrim(row?.filename) || "fw-rules-1.yaml";
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
    [items, setLoading, setError, load]
  );

  const canSubmit = React.useMemo(() => {
    return isNonEmptyString(form.filename) && isNonEmptyString(form.appflowid);
  }, [form]);

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
        .replace(/[^A-Z]/g, "");

      await saveFwConfigItem("fw-rules", {
        filename: form.filename,
        name: nextAppflowid,
        data: {
          appflowid: nextAppflowid,
          "source-list": source,
          "destination-list": destination,
          "protocol-port-reference": refs,
          "business-purpose-reference": safeTrim(form.businessPurpose),
          keywords,
          envs,
        },
      });
      setActivePage("list");
      setSavedSourceItems(source);
      setSavedDestinationItems(destination);
      setIsEditingSource(false);
      setIsEditingDestination(false);
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [form, setLoading, setError, load]);

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

  const getRowKey = React.useCallback((row) => {
    const filename = safeTrim(row?.filename);
    const appflowid = safeTrim(row?.data?.appflowid) || safeTrim(row?.name);
    return `${filename}::${appflowid}`;
  }, []);

  const onStartInlineEdit = React.useCallback(
    (row) => {
      const key = getRowKey(row);
      const bp = safeTrim(row?.data?.["business-purpose-reference"]);
      const pp = Array.isArray(row?.data?.["protocol-port-reference"]) ? row.data["protocol-port-reference"] : [];
      const kw = Array.isArray(row?.data?.keywords) ? row.data.keywords : [];
      const envs = Array.isArray(row?.data?.envs) ? row.data.envs : [];
      setInlineEdit({
        key,
        row,
        filename: safeTrim(row?.filename),
        businessPurpose: bp,
        protocolPortRefs: pp,
        keywords: kw,
        envs,
      });
    },
    [getRowKey]
  );

  const onCancelInlineEdit = React.useCallback(() => {
    setInlineEdit({ key: "", row: null, filename: "", businessPurpose: "", protocolPortRefs: [], keywords: [], envs: [] });
  }, []);

  const onSaveInlineEdit = React.useCallback(async () => {
    const row = inlineEdit.row;
    if (!row) return;

    try {
      setLoading(true);
      setError("");

      const oldFilename = safeTrim(row?.filename);
      const newFilename = safeTrim(inlineEdit.filename) || oldFilename;
      const appflowid = safeTrim(row?.data?.appflowid) || safeTrim(row?.name);

      const nextData = {
        ...(row?.data || {}),
        appflowid,
        "business-purpose-reference": safeTrim(inlineEdit.businessPurpose),
        "protocol-port-reference": Array.isArray(inlineEdit.protocolPortRefs) ? inlineEdit.protocolPortRefs : [],
        keywords: Array.isArray(inlineEdit.keywords) ? inlineEdit.keywords : [],
        envs: Array.isArray(inlineEdit.envs) ? inlineEdit.envs : [],
      };
      delete nextData.business_purpose;
      delete nextData.name;

      await saveFwConfigItem("fw-rules", { filename: newFilename, name: appflowid, data: nextData });
      if (oldFilename && newFilename && oldFilename !== newFilename) {
        try {
          await deleteFwConfigItem("fw-rules", { filename: oldFilename, name: appflowid });
        } catch (e) {
          // ignore
        }
      }

      onCancelInlineEdit();
      await load();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [inlineEdit, setLoading, setError, load, onCancelInlineEdit]);

  return (
    <>
      {activePage === "details" ? (
        <FwRuleDetailsView
          mode={detailsMode}
          form={form}
          setForm={setForm}
          canSubmit={canSubmit}
          onBack={() => setActivePage("list")}
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
          envNames={envNames}
          keywordNames={keywordNames}
          portProtocolNames={portProtocolNames}
          businessPurposeNames={businessPurposeNames}
        />
      ) : (
        <FwRulesTableView
          rows={sortedRows}
          filters={filters}
          setFilters={setFilters}
          onAdd={onAdd}
          onEdit={onEdit}
          onEditYaml={onEditYaml}
          onCopy={onCopy}
          onDelete={onDelete}
          inlineEdit={inlineEdit}
          getRowKey={getRowKey}
          onStartInlineEdit={onStartInlineEdit}
          onCancelInlineEdit={onCancelInlineEdit}
          onSaveInlineEdit={onSaveInlineEdit}
          setInlineEdit={setInlineEdit}
          businessPurposeNames={businessPurposeNames}
          keywordNames={keywordNames}
          envNames={envNames}
          portProtocolNames={portProtocolNames}
          MultiSelectPicker={MultiSelectPicker}
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

      <ConfirmationModal
        show={confirmDelete.show}
        title="Delete item"
        message={
          confirmDelete.row
            ? `Delete '${safeTrim(confirmDelete.row?.data?.appflowid)}' from ${confirmDelete.row.filename}?`
            : ""
        }
        onClose={() => setConfirmDelete({ show: false, row: null })}
        onConfirm={onConfirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
