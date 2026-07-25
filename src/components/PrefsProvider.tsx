import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { langStore } from '../lib/api';
import { PrefsContext } from '../lib/prefs';
import type { Theme } from '../lib/prefs';
import type { Lang } from '../lib/types';

const THEME_KEY = 'rental-admin.theme';

function initialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => langStore.get());
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setLang = useCallback((next: Lang) => {
    langStore.set(next);
    setLangState(next);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    [],
  );

  const value = useMemo(
    () => ({ lang, setLang, theme, toggleTheme }),
    [lang, setLang, theme, toggleTheme],
  );

  return <PrefsContext value={value}>{children}</PrefsContext>;
}
