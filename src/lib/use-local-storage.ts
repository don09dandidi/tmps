import { useCallback, useEffect, useState } from "react";

/**
 * Like useState, but persisted to localStorage under `key`.
 *
 * SSR-safe: on the server (and on the client's first render, to avoid a
 * hydration mismatch) it returns `initialValue`. It then hydrates from
 * localStorage in a useEffect, which only runs in the browser.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Corrupt or inaccessible storage — fall back to initialValue silently.
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage full or unavailable (private browsing) — state still updates in memory.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated] as const;
}
