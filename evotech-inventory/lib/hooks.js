"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reads from the API and hands the screen four things: data, loading, error,
 * and a reload function.
 *
 * `loading` stays false on refetch when data is already on screen — a POS
 * that blanks its cart list every few seconds is unusable. Refreshes swap
 * the numbers underneath instead.
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const hasData = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!hasData.current) setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      hasData.current = true;
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, loading, reload: run, setData };
}

/**
 * Wraps a write — create a sale, save a product. Returns `pending` so the
 * button can disable itself, which is the only thing standing between an
 * impatient cashier and a double-charged customer.
 */
export function useAction(action) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setPending(false);
      }
    },
    [action]
  );

  return { run, pending, error, clearError: () => setError(null) };
}

/** Ticking clock for the POS header and the attendance screen. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Delays a fast-changing value — used for search-as-you-type. */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
