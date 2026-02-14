"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Debounces a value by `delay` milliseconds.
 *
 * Returns the debounced value — it will only update after the caller
 * stops changing the input for the given delay.
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebouncedValue(search, 300);
 * // debouncedSearch updates 300ms after the user stops typing
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't debounce the initial value — use it immediately
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

