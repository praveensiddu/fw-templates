function FloatingMultiSelect({
  options,
  values,
  onChange,
  placeholder,
  inputTestId,
  onEnter,
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState(null);
  const wrapRef = React.useRef(null);

  const normalizedOptions = Array.isArray(options) ? options : [];
  const selected = React.useMemo(() => {
    const raw = Array.isArray(values) ? values : [];
    const out = [];
    for (const it of raw) {
      if (it && typeof it === "object") {
        const v = safeTrim(it.value);
        if (v) out.push(v);
        continue;
      }
      const v = safeTrim(it);
      if (v) out.push(v);
    }
    return out;
  }, [values]);

  // The menu is position:fixed so scroll containers (e.g. table cards) never clip it;
  // it flips upward when there is not enough room below.
  React.useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return undefined;
    }
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 200 && above > below;
      setMenuPos({
        left: r.left,
        width: r.width,
        top: up ? undefined : r.bottom + 4,
        bottom: up ? window.innerHeight - r.top + 4 : undefined,
        maxHeight: Math.max(120, Math.min(260, up ? above : below)),
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, selected.length]);

  const optionRecords = React.useMemo(() => {
    const out = [];
    for (const opt of normalizedOptions) {
      if (opt && typeof opt === "object") {
        const value = safeTrim(opt.value);
        const label = isNonEmptyString(opt.label) ? String(opt.label) : value;
        if (!value) continue;
        out.push({ value, label });
        continue;
      }
      const value = safeTrim(opt);
      if (!value) continue;
      out.push({ value, label: value });
    }
    return out;
  }, [normalizedOptions]);

  const labelByValue = React.useMemo(() => {
    const m = {};
    for (const rec of optionRecords) {
      if (!rec?.value) continue;
      m[String(rec.value).toLowerCase()] = rec.label;
    }
    return m;
  }, [optionRecords]);

  const filteredOptions = React.useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    const chosen = new Set(selected.map((x) => String(x).toLowerCase()));
    const available = optionRecords.filter((x) => !chosen.has(String(x.value).toLowerCase()));
    if (!q) return available;
    return available.filter((x) => String(x?.label || "").toLowerCase().includes(q) || String(x?.value || "").toLowerCase().includes(q));
  }, [optionRecords, query, selected]);

  function addValue(name) {
    const v = String(name || "").trim();
    if (!v) return;
    const exists = selected.some((x) => String(x).toLowerCase() === v.toLowerCase());
    const nextList = exists ? selected : [...selected, v];
    onChange(nextList);
    setQuery("");
    setOpen(false);
  }

  function removeValue(name) {
    const v = String(name || "").trim();
    if (!v) return;
    const nextList = selected.filter((x) => String(x).toLowerCase() !== v.toLowerCase());
    onChange(nextList);
  }

  return (
    <div
      ref={wrapRef}
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
            <span>{labelByValue[String(c || "").toLowerCase()] || c}</span>
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
              const q = String(query || "").trim();
              if (!q && typeof onEnter === "function") {
                onEnter();
                return;
              }

              const first = filteredOptions[0];
              if (first) addValue(first.value);
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
            position: "fixed",
            zIndex: 10001,
            left: menuPos ? menuPos.left : 0,
            width: menuPos ? menuPos.width : undefined,
            top: menuPos ? menuPos.top : undefined,
            bottom: menuPos ? menuPos.bottom : undefined,
            visibility: menuPos ? "visible" : "hidden",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: menuPos ? menuPos.maxHeight : 220,
            overflow: "auto",
          }}
          tabIndex={-1}
        >
          {filteredOptions.length === 0 ? (
            <div className="muted" style={{ padding: 10 }}>
              {optionRecords.length > 0 && !String(query || "").trim() ? "All options selected" : "No matches"}
            </div>
          ) : (
            filteredOptions.map((c) => (
              <button
                key={c.value}
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
                  addValue(c.value);
                }}
              >
                {c.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
