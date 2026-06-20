import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'forge-theme';
const VALID = new Set(['dark', 'light']);

function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (VALID.has(saved)) return saved;
  } catch {
    // ignore
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

/**
 * Theme hook — matches OpenDesign toggle behaviour:
 *   data-theme="dark"|"light" on <html>, persisted in localStorage as `forge-theme`,
 *   defaults to dark, falls back to prefers-color-scheme only on first visit.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // If no saved value, follow OS changes; once user toggles, OS stops mattering.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let stored = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { stored = null; }
    if (stored && VALID.has(stored)) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e) => setThemeState(e.matches ? 'light' : 'dark');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const setTheme = useCallback((next) => {
    if (!VALID.has(next)) return;
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggle };
}