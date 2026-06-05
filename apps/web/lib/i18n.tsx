'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Lightweight bilingual layer (Spanish / English). Instead of a giant key
// dictionary, components call t('texto en español', 'english text') inline, so
// pages can be translated incrementally. The choice is saved per device.

export type Lang = 'es' | 'en';
const KEY = 'app-lang';

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Returns the Spanish or English string for the current language. */
  t: (es: string, en: string) => string;
  ready: boolean;
};

const Ctx = createContext<LangCtx>({
  lang: 'es',
  setLang: () => {},
  t: (es) => es,
  ready: false,
});

function detectInitial(): Lang {
  if (typeof navigator === 'undefined') return 'es';
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
    setLangState(stored === 'en' || stored === 'es' ? stored : detectInitial());
    setReady(true);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  };

  const t = (es: string, en: string) => (lang === 'en' ? en : es);

  // Cast works around a harmless @types/react duplication in the monorepo
  // (18.x + 19.x) that otherwise mistypes Context.Provider as a JSX element.
  const Provider = Ctx.Provider as unknown as (props: {
    value: LangCtx;
    children: React.ReactNode;
  }) => React.ReactElement;

  return <Provider value={{ lang, setLang, t, ready }}>{children}</Provider>;
}

export const useLang = () => useContext(Ctx);
