/**
 * useTableFilter Hook - Centralized table filtering and sorting logic.
 */

function formatTableValue(val) {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) {
    if (val.length > 0 && typeof val[0] === "object") {
      return `${val.length} item${val.length !== 1 ? "s" : ""}`;
    }
    return val.join(", ");
  }
  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function useTableFilter({
  rows = [],
  initialFilters = {},
  fieldMapping,
  sortBy = null,
  caseSensitive = false,
}) {
  const { filters, setFilters, updateFilter, resetFilters } = useFilters(initialFilters);

  const filteredRows = React.useMemo(() => {
    if (!Array.isArray(rows)) return [];

    return rows.filter((row) => {
      const fields = fieldMapping(row);

      return Object.keys(filters).every((filterKey) => {
        const filterValue = safeTrim(filters[filterKey]);
        if (!filterValue) return true;

        const fieldValue = formatTableValue(fields[filterKey]);

        if (caseSensitive) {
          return fieldValue.includes(filterValue);
        }
        return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [rows, filters, fieldMapping, caseSensitive]);

  const sortedRows = React.useMemo(() => {
    if (!sortBy) return filteredRows;
    return [...filteredRows].sort(sortBy);
  }, [filteredRows, sortBy]);

  return { filteredRows, sortedRows, filters, setFilters, updateFilter, resetFilters, formatValue: formatTableValue };
}
