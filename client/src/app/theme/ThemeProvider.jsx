import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * App-wide light/dark mode.
 *
 * AntD v5 themes are driven by `ConfigProvider`'s `theme.algorithm` (defaultAlgorithm /
 * darkAlgorithm). This provider owns the `mode` string + persistence so the ConfigProvider
 * (in `main.jsx`) and the header toggle read/write a single source of truth.
 *
 * Initialization order (resolved once on first render, so no flash of the wrong theme):
 *   1. `localStorage['docio-theme']` if the user has explicitly toggled before.
 *   2. Otherwise the OS `prefers-color-scheme: dark` media query.
 *   3. Default 'light'.
 *
 * We also reflect the mode onto `document.documentElement.dataset.theme` so any non-AntD
 * CSS (e.g. the body background) can react without depending on the AntD token system.
 */
const STORAGE_KEY = 'docio-theme';
const ThemeContext = createContext(null);

function getInitialMode() {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
    // Bind a default page background to the mode so the area outside AntD's Layout (and the
    // initial paint before React mounts) isn't a white flash in dark mode.
    document.body.style.backgroundColor = mode === 'dark' ? '#141414' : '#f5f5f5';
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      setMode,
      toggleTheme: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

export default ThemeProvider;
