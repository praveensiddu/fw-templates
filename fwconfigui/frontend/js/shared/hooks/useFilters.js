/**
 * useFilters Hook - Centralized filter state management.
 */

function useFilters(initialFilters = {}) {
  const [filters, setFilters] = React.useState(() => ({ ...(initialFilters || {}) }));

  const updateFilter = React.useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters({ ...(initialFilters || {}) });
  }, [initialFilters]);

  return { filters, setFilters, updateFilter, resetFilters };
}
