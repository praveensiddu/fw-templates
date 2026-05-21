function SingleSelectPicker({
  options,
  value,
  onChange,
  placeholder,
  inputTestId,
  allowEmpty,
  emptyLabel,
}) {
  const normalizedOptions = Array.isArray(options) ? options : [];
  const selectedValue = safeTrim(value);

  const [query, setQuery] = React.useState(selectedValue);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setQuery(selectedValue);
  }, [selectedValue]);

  const filteredOptions = React.useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((x) => String(x).toLowerCase().includes(q));
  }, [normalizedOptions, query]);

  function chooseValue(v) {
    const next = safeTrim(v);
    if (typeof onChange === "function") onChange(next);
    setQuery(next);
    setOpen(false);
  }

  function chooseEmpty() {
    if (typeof onChange === "function") onChange("");
    setQuery("");
    setOpen(false);
  }

  const showEmpty = !!allowEmpty;
  const emptyText = isNonEmptyString(emptyLabel) ? emptyLabel : "(none)";

  return (
    <div
      style={{ position: "relative", flex: 1 }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <input
        className="filterInput"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        data-testid={inputTestId}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();

            const q = safeTrim(query);
            if (!q && showEmpty) {
              chooseEmpty();
              return;
            }

            const exact = normalizedOptions.find((x) => String(x).toLowerCase() === String(q).toLowerCase());
            if (exact) {
              chooseValue(exact);
              return;
            }

            const first = filteredOptions[0];
            if (first) {
              chooseValue(first);
            }
          }
        }}
      />

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
          {showEmpty ? (
            <button
              type="button"
              className="btn"
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                borderRadius: 0,
                padding: "10px 10px",
                fontWeight: selectedValue ? 400 : 650,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                chooseEmpty();
              }}
            >
              {emptyText}
            </button>
          ) : null}

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
                  fontWeight: String(c).toLowerCase() === String(selectedValue).toLowerCase() ? 650 : 400,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  chooseValue(c);
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
