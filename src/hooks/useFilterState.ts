import { useCallback, useMemo, useState } from 'react';

export function useFilterState<T extends Record<string, unknown>>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const setMany = useCallback((nextFilters: Partial<T>) => {
    setFilters((current) => ({ ...current, ...nextFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const hasActiveFilters = useMemo(
    () =>
      Object.entries(filters).some(([key, value]) => {
        const initialValue = initialFilters[key as keyof T];
        return value !== initialValue;
      }),
    [filters, initialFilters]
  );

  return {
    filters,
    setFilter: updateFilter,
    setFilters: setMany,
    resetFilters,
    hasActiveFilters,
  };
}
