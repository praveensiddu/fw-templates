function MultiSelectPicker({
  options,
  values,
  onChange,
  placeholder,
  inputTestId,
  onEnter,
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

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
    if (!q) return optionRecords;
    return optionRecords.filter((x) => String(x?.label || "").toLowerCase().includes(q) || String(x?.value || "").toLowerCase().includes(q));
  }, [optionRecords, query]);

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
