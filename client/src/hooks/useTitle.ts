import { useEffect } from 'react';

/**
 * useTitle — set `document.title` for the lifetime of the calling component and reset it
 * to the previous value on unmount.
 */
export function useTitle(title: string, suffix = 'Docio'): void {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = suffix ? `${title} · ${suffix}` : title;
    return () => {
      document.title = previous;
    };
  }, [title, suffix]);
}

export default useTitle;
