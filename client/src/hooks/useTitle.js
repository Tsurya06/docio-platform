import { useEffect } from 'react';

/**
 * useTitle — set `document.title` for the lifetime of the calling component and reset it
 * to the previous value on unmount. Keeping this as a hook (vs setting document.title
 * inline in a page component) means the responsibility lives next to the routing chain
 * — even page placeholders get reasonable titles without writers copy-pasting the side
 * effect. Reset-to-previous is intentional: long-lived layouts can have a default
 * title we don't want to clobber.
 *
 * Suffix is decorative; tweak through the call site, not in a config.
 */
export function useTitle(title, suffix = 'Docio') {
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
