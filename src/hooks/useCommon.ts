import { useState, useEffect, useCallback } from 'react';

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useTableState(initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const reset = useCallback(() => {
    setPage(1);
    setSearch('');
    setSortKey(null);
  }, []);

  return { page, pageSize, search, sortKey, sortDir, setPage, setPageSize, setSearch, setSortKey, setSortDir, reset };
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  const setStored = (val: T) => {
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
  };
  return [value, setStored];
}