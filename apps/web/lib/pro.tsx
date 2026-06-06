'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// "Pro" (advanced) mode. OFF by default = the simplest possible interface for a
// complete beginner. ON = reveals technical controls (gain/sensitivity, XRF CSV
// input, per-element tables, the dealer calculator) and the advanced nav pages.
// Saved per device.

const KEY = 'app-pro';

type ProCtx = { pro: boolean; setPro: (v: boolean) => void; ready: boolean };

const Ctx = createContext<ProCtx>({ pro: false, setPro: () => {}, ready: false });

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [pro, setProState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setProState(localStorage.getItem(KEY) === '1'); } catch { /* ignore */ }
    setReady(true);
  }, []);

  const setPro = (v: boolean) => {
    setProState(v);
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignore */ }
  };

  // Cast works around a harmless @types/react duplication in the monorepo
  // (18.x + 19.x) that otherwise mistypes Context.Provider as a JSX element.
  const Provider = Ctx.Provider as unknown as (props: {
    value: ProCtx;
    children: React.ReactNode;
  }) => React.ReactElement;

  return <Provider value={{ pro, setPro, ready }}>{children}</Provider>;
}

export const usePro = () => useContext(Ctx);
