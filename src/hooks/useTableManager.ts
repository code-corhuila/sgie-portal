import { useCallback, useEffect, useMemo, useState } from 'react';

export interface TableManagerOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  totalItems?: number;
}

export interface TableManagerResult<T> {
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalItems: number;
  totalPages: number;
  data: T[];
  goto: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
}

export function useTableManager<T>(source: T[], options: TableManagerOptions = {}): TableManagerResult<T> {
  const { initialPage = 0, initialPageSize = 10, pageSizeOptions = [10, 20, 50, 100], totalItems } = options;
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const itemsCount = totalItems ?? source.length;
  const totalPages = Math.max(1, Math.ceil(itemsCount / pageSize) || 1);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const data = useMemo(() => {
    if (source.length === itemsCount) {
      const start = page * pageSize;
      return source.slice(start, start + pageSize);
    }
    return source;
  }, [itemsCount, page, pageSize, source]);

  const goto = useCallback(
    (target: number) => {
      if (totalPages === 0) {
        setPage(0);
        return;
      }
      const clamped = Math.min(Math.max(target, 0), totalPages - 1);
      setPage(clamped);
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    pageSizeOptions,
    totalItems: itemsCount,
    totalPages,
    data,
    goto,
    setPageSize: handlePageSizeChange,
    reset,
  };
}
