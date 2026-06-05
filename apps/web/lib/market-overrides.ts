'use client';

import { useEffect, useState } from 'react';
import type { CommercializationGrade } from '@watch-auth/core';

// Per-model price overrides set by the user (their own real figures), stored
// locally. Values are kept in USD (the data base currency); the UI converts for
// display. An override takes precedence over curated/estimated market data.

export type MarketOverride = {
  retail: number;
  wholesale: number;
  grade: CommercializationGrade;
  demandScore: number;
  updatedAt: string;
};

const KEY = 'market-overrides';
const EVT = 'market-overrides-changed';

function readAll(): Record<string, MarketOverride> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, MarketOverride>;
  } catch {
    return {};
  }
}

export function getOverride(modelId: string): MarketOverride | undefined {
  return readAll()[modelId];
}

export function saveOverride(modelId: string, o: MarketOverride): void {
  if (typeof window === 'undefined') return;
  const all = readAll();
  all[modelId] = o;
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(EVT));
}

export function clearOverride(modelId: string): void {
  if (typeof window === 'undefined') return;
  const all = readAll();
  delete all[modelId];
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event(EVT));
}

/** React hook: the override for a model + save/clear, reactive across the tab. */
export function useOverride(modelId: string): {
  override: MarketOverride | undefined;
  save: (o: MarketOverride) => void;
  clear: () => void;
} {
  const [override, setOverride] = useState<MarketOverride | undefined>(undefined);
  useEffect(() => {
    const read = () => setOverride(getOverride(modelId));
    read();
    window.addEventListener(EVT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(EVT, read);
      window.removeEventListener('storage', read);
    };
  }, [modelId]);
  return {
    override,
    save: (o) => { saveOverride(modelId, o); setOverride(o); },
    clear: () => { clearOverride(modelId); setOverride(undefined); },
  };
}
