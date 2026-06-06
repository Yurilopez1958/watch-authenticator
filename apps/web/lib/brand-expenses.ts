'use client';

import { useEffect, useState } from 'react';

// ── Per-brand expense percentages (admin-configured, stored locally) ──────────
//
// DATA MODEL
//   ExpenseItem  : one named expense as a percentage (e.g. "Transport" 5%).
//   Store shape  : Record<brandId, ExpenseItem[]>  →  one list per brand.
//   localStorage : key 'brand-expenses'  (single JSON blob, per device).
//
// CALCULATION (base price = wholesale by default; the page can pass retail):
//   sumPct      = Σ active item percents
//   purchase    = base × (1 − sumPct/100)   ← "precio de compra" (deduct expenses)
//   totalCost   = base × (1 + sumPct/100)   ← "coste total"     (add expenses)
//   Percentages are SUMMED (not compounded). purchase is clamped at 0.
//
// ADMIN PIN: a local, casual lock (NOT real security — localStorage is readable).
//   Stored as a non-reversible hash so the PIN isn't kept in plain text.

export type ExpenseItem = {
  id: string;
  label: string;
  percent: number; // 0..1000, non-negative
  active: boolean;
};

export type BrandExpensesMap = Record<string, ExpenseItem[]>;

const KEY = 'brand-expenses';
const PIN_KEY = 'admin-pin-hash';
const EVT = 'brand-expenses-changed';

/** RFC4122-ish id with fallbacks (older Safari / non-secure contexts). */
export function makeExpenseId(): string {
  const c = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (c?.randomUUID) return c.randomUUID();
  return 'x' + Math.abs(Date.now() ^ Math.floor(Math.random() * 1e9)).toString(16);
}

function isItem(v: unknown): v is ExpenseItem {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string'
    && typeof o.label === 'string'
    && typeof o.percent === 'number' && Number.isFinite(o.percent)
    && typeof o.active === 'boolean';
}

function readAll(): BrandExpensesMap {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: BrandExpensesMap = {};
    for (const [brandId, list] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(list)) out[brandId] = list.filter(isItem);
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map: BrandExpensesMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(EVT));
  } catch (e) {
    console.warn('Could not save brand expenses:', (e as Error).message);
  }
}

export function getBrandExpenses(brandId: string): ExpenseItem[] {
  return readAll()[brandId] ?? [];
}

/** Sanitises and persists the list for one brand. */
export function saveBrandExpenses(brandId: string, items: ExpenseItem[]): void {
  const clean = items
    .map((i) => ({
      id: i.id || makeExpenseId(),
      label: i.label.trim(),
      percent: Number.isFinite(i.percent) ? Math.min(1000, Math.max(0, i.percent)) : 0,
      active: !!i.active,
    }))
    .filter((i) => i.label.length > 0);
  const all = readAll();
  all[brandId] = clean;
  writeAll(all);
}

// ── Calculation ───────────────────────────────────────────────────────────────

export type BrandPricing = {
  sumPct: number;          // total active percentage
  purchase: number;        // base × (1 − sumPct/100), clamped ≥ 0
  totalCost: number;       // base × (1 + sumPct/100)
  over100: boolean;        // sumPct ≥ 100 → purchase would be ≤ 0
  breakdown: { label: string; percent: number; amount: number }[];
};

/** Applies a brand's active expense percentages to a base price. */
export function computeBrandPricing(base: number, items: ExpenseItem[]): BrandPricing {
  const active = items.filter((i) => i.active && i.percent > 0);
  const sumPct = active.reduce((s, i) => s + Math.max(0, i.percent), 0);
  const factorDown = Math.max(0, 1 - sumPct / 100);
  return {
    sumPct,
    purchase: Math.round(base * factorDown),
    totalCost: Math.round(base * (1 + sumPct / 100)),
    over100: sumPct >= 100,
    breakdown: active.map((i) => ({ label: i.label, percent: i.percent, amount: Math.round(base * (i.percent / 100)) })),
  };
}

// ── Admin PIN (local, casual lock) ────────────────────────────────────────────

/** Non-cryptographic FNV-1a hash (good enough to avoid storing the PIN in clear). */
function hashPin(pin: string): string {
  let h = 0x811c9dc5;
  const s = 'wa-admin:' + pin;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

export function hasPin(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(PIN_KEY);
}

export function setPin(pin: string): void {
  try { localStorage.setItem(PIN_KEY, hashPin(pin)); } catch { /* ignore */ }
}

export function verifyPin(pin: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PIN_KEY) === hashPin(pin);
}

// ── React hook ────────────────────────────────────────────────────────────────

/** Reactive expense list for a brand + a setter. Updates across the tab. */
export function useBrandExpenses(brandId: string): {
  items: ExpenseItem[];
  save: (items: ExpenseItem[]) => void;
  ready: boolean;
} {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => setItems(getBrandExpenses(brandId));
    read();
    setReady(true);
    window.addEventListener(EVT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(EVT, read);
      window.removeEventListener('storage', read);
    };
  }, [brandId]);
  return { items, save: (next) => { saveBrandExpenses(brandId, next); setItems(getBrandExpenses(brandId)); }, ready };
}
