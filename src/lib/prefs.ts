import { createContext, use } from 'react';
import type { Lang } from './types';

export type Theme = 'light' | 'dark';

export interface Prefs {
  /** Language sent as Accept-Language, so listing text comes back localized. */
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const PrefsContext = createContext<Prefs | null>(null);

export function usePrefs() {
  const ctx = use(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>.');
  return ctx;
}
