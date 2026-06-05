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

/** True when an unknown value has the shape of a stored MarketOverride. */
function isOverride(v: unknown): v is MarketOverride {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.retail === 'number' && Number.isFinite(o.retail) &&
    typeof o.wholesale === 'number' && Number.isFinite(o.wholesale) &&
    (o.grade === 'fast' || o.grade === 'medium' || o.grade === 'slow') &&
    typeof o.demandScore === 'number'
  );
}

function readAll(): Record<string, MarketOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    // Keep only well-formed entries so corrupt/legacy data can't crash the UI.
    const out: Record<string, MarketOverride> = {};
    for (const [id, val] of Object.entries(parsed as Record<string, unknown>)) {
      if (isOverride(val)) out[id] = val;
    }
    return out;
  } catch {
    return {};
  }
}

/** Persists the override map; swallows quota/serialization errors. */
function writeAll(all: Record<string, MarketOverride>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(EVT));
  } catch (e) {
    console.warn('Could not save market overrides:', (e as Error).message);
  }
}

export function getOverride(modelId: string): MarketOverride | undefined {
  return readAll()[modelId];
}

export function saveOverride(modelId: string, o: MarketOverride): void {
  if (typeof window === 'undefined') return;
  const all = readAll();
  all[modelId] = o;
  writeAll(all);
}

export function clearOverride(modelId: string): void {
  if (typeof window === 'undefined') return;
  const all = readAll();
  delete all[modelId];
  writeAll(all);
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
