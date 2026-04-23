import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_THEME_ID, type ThemeId } from '@kairo/shared';
import { getTheme } from '@kairo/themes';

export type ColorSchemePreference = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  preference: ColorSchemePreference;
  setPreference: (p: ColorSchemePreference) => void;
  /** Currently effective mode after resolving `system`. */
  mode: ResolvedMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LS_THEME = 'kairo.theme';
const LS_PREF = 'kairo.mode';

function getSystemMode(): ResolvedMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function loadStored<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw && (allowed as readonly string[]).includes(raw)) return raw as T;
  } catch {
    // ignore (private mode / quota)
  }
  return fallback;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultThemeId?: ThemeId;
  defaultPreference?: ColorSchemePreference;
}

export function ThemeProvider({
  children,
  defaultThemeId = DEFAULT_THEME_ID,
  defaultPreference = 'system',
}: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<ThemeId>(() =>
    loadStored<ThemeId>(LS_THEME, defaultThemeId, [
      'warm-japandi',
      'morning-mist',
      'deep-night',
      'paper-book',
    ]),
  );
  const [preference, setPreferenceState] = useState<ColorSchemePreference>(() =>
    loadStored<ColorSchemePreference>(LS_PREF, defaultPreference, ['light', 'dark', 'system']),
  );
  const [systemMode, setSystemMode] = useState<ResolvedMode>(() => getSystemMode());

  // Track system preference changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const mode: ResolvedMode = preference === 'system' ? systemMode : preference;

  // Apply to <html> attributes so CSS vars cascade.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = themeId;
    root.dataset.mode = mode;
    // Hint to native form controls
    root.style.colorScheme = mode;
  }, [themeId, mode]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    try {
      window.localStorage.setItem(LS_THEME, id);
    } catch {
      /* ignore */
    }
  }, []);

  const setPreference = useCallback((p: ColorSchemePreference) => {
    setPreferenceState(p);
    try {
      window.localStorage.setItem(LS_PREF, p);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, setThemeId, preference, setPreference, mode }),
    [themeId, setThemeId, preference, setPreference, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

export function useThemeDefinition() {
  const { themeId } = useTheme();
  return getTheme(themeId);
}
