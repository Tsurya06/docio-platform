import { useEffect, useState } from 'react';

/**
 * useDebounce — staleness-delayed version of a value. Triggering: any change to `value`
 * schedules an internal state update after `delay` ms; if a new value lands in that
 * window the timer resets and the previous value is dropped.
 *
 * Used to debounce search-box queries so we don't fire one RTK Query per keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export default useDebounce;
