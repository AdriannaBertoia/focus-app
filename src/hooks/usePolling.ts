"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Calls `fetchFn` on mount and then every `intervalMs` milliseconds.
 * Pauses when the tab is hidden and resumes (with an immediate fetch) when visible again.
 */
export function usePolling(fetchFn: () => void, intervalMs = 30_000) {
  const savedFn = useRef(fetchFn);

  useEffect(() => {
    savedFn.current = fetchFn;
  }, [fetchFn]);

  const tick = useCallback(() => savedFn.current(), []);

  useEffect(() => {
    // Initial fetch
    tick();

    const id = setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tick, intervalMs]);
}
