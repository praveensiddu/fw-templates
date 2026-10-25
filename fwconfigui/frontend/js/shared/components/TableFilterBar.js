// Filter state lives in the shared `filters` object: `__search` is the global
// search text and `__open` toggles the per-column filter row.
function tableFilterClass(filters) {
  return filters && filters.__open ? "" : "hideFilterRow";
}

function TableFilterBar({ filters, setFilters }) {
  const f = filters || {};
  const columnKeys = Object.keys(f).filter((k) => !k.startsWith("__"));
  const activeColumns = columnKeys.filter((k) => safeTrim(f[k])).length;
  const hasSearch = !!safeTrim(f.__search);
  const set = (patch) => setFilters((p) => ({ ...p, ...patch }));

  const clearAll = () => {
    setFilters((p) => {
      const next = { ...p, __search: "" };
      for (const k of Object.keys(next)) if (!k.startsWith("__")) next[k] = "";
      return next;
    });
  };

  return (
    <div className="filterBar">
      <div className="filterSearch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={f.__search || ""}
          onChange={(e) => set({ __search: e.target.value })}
          placeholder="Search all columns..."
          aria-label="Search all columns"
        />
        {hasSearch ? (
          <button type="button" className="filterClear" aria-label="Clear search" onClick={() => set({ __search: "" })}>
            ×
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className={`filterToggle ${f.__open ? "filterToggle-on" : ""}`}
        aria-expanded={!!f.__open}
        onClick={() => set({ __open: !f.__open })}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" />
        </svg>
        Column filters
        {activeColumns > 0 ? <span className="filterBadge">{activeColumns}</span> : null}
      </button>

      {hasSearch || activeColumns > 0 ? (
        <button type="button" className="filterReset" onClick={clearAll}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}
