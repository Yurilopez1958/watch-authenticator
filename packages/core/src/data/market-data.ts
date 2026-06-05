// Market intelligence (valuation) — Phase 1.
// A small set of CURATED orientative figures for popular references, plus a
// heuristic ESTIMATOR that derives an orientative valuation for ANY other model
// from its brand / collection / material so the whole catalog has coverage.
// All figures are orientative (not quotes); structured so the curated layer can
// later be replaced by a Supabase table or a real market API (Chrono24 / WatchCharts).

import { ALL_MODELS } from './brands';
import type { Model } from '../types/index';

/** Liquidity / how quickly the model sells on the secondary market. */
export type CommercializationGrade = 'fast' | 'medium' | 'slow';

export type MarketData = {
  modelId: string;
  /** Average secondary / collector market price. */
  retail: number;
  /** Wholesale / dealer buy price (what a trader typically pays). */
  wholesale: number;
  currency: 'USD' | 'EUR';
  grade: CommercializationGrade;
  /** 0–100, drives the demand "temperature" bar. */
  demandScore: number;
  /** ISO date the figure was last reviewed. */
  updatedAt: string;
  source: string;
  /** True when the figure is heuristic-estimated rather than curated. */
  estimated: boolean;
};

type Entry = Omit<MarketData, 'modelId' | 'estimated'>;

const D = '2025-06-01';
const SRC = 'Orientative (mock) — refine with real market data';

/** Curated seed of popular references. Keyed by catalog model id. */
const CURATED: Readonly<Record<string, Entry>> = {
  // ---- Rolex ----
  'rolex-submariner-124060':        { retail: 10500, wholesale: 9000,  currency: 'USD', grade: 'fast',   demandScore: 90, updatedAt: D, source: SRC },
  'rolex-submariner-date-126610ln': { retail: 13500, wholesale: 11800, currency: 'USD', grade: 'fast',   demandScore: 88, updatedAt: D, source: SRC },
  'rolex-submariner-date-126610lv': { retail: 17000, wholesale: 15000, currency: 'USD', grade: 'fast',   demandScore: 85, updatedAt: D, source: SRC },
  'rolex-gmt-master-ii-126710blro': { retail: 19000, wholesale: 16500, currency: 'USD', grade: 'fast',   demandScore: 90, updatedAt: D, source: SRC },
  'rolex-gmt-master-ii-126710blnr': { retail: 16500, wholesale: 14500, currency: 'USD', grade: 'fast',   demandScore: 88, updatedAt: D, source: SRC },
  'rolex-daytona-126500ln':         { retail: 32000, wholesale: 28000, currency: 'USD', grade: 'fast',   demandScore: 95, updatedAt: D, source: SRC },
  'rolex-daytona-116500ln':         { retail: 30000, wholesale: 26000, currency: 'USD', grade: 'fast',   demandScore: 92, updatedAt: D, source: SRC },
  'rolex-datejust-41-126300':       { retail: 9500,  wholesale: 8000,  currency: 'USD', grade: 'medium', demandScore: 70, updatedAt: D, source: SRC },
  'rolex-datejust-36-126234':       { retail: 8800,  wholesale: 7300,  currency: 'USD', grade: 'medium', demandScore: 68, updatedAt: D, source: SRC },
  'rolex-day-date-40-228238':       { retail: 42000, wholesale: 36000, currency: 'USD', grade: 'medium', demandScore: 60, updatedAt: D, source: SRC },
  'rolex-sky-dweller-336934':       { retail: 16000, wholesale: 13800, currency: 'USD', grade: 'medium', demandScore: 65, updatedAt: D, source: SRC },
  // ---- Patek Philippe ----
  'patek-nautilus-5711-1a-010':     { retail: 95000, wholesale: 82000, currency: 'USD', grade: 'fast',   demandScore: 96, updatedAt: D, source: SRC },
  'patek-aquanaut-5167a-001':       { retail: 48000, wholesale: 42000, currency: 'USD', grade: 'fast',   demandScore: 85, updatedAt: D, source: SRC },
  'patek-calatrava-5196g':          { retail: 26000, wholesale: 21000, currency: 'USD', grade: 'slow',   demandScore: 40, updatedAt: D, source: SRC },
  // ---- Audemars Piguet ----
  'ap-royal-oak-15500st':           { retail: 38000, wholesale: 33000, currency: 'USD', grade: 'fast',   demandScore: 88, updatedAt: D, source: SRC },
  'ap-royal-oak-15510st':           { retail: 40000, wholesale: 35000, currency: 'USD', grade: 'fast',   demandScore: 88, updatedAt: D, source: SRC },
  // ---- Omega ----
  'omega-speedmaster-moonwatch-hesalite': { retail: 6500, wholesale: 5400, currency: 'USD', grade: 'medium', demandScore: 72, updatedAt: D, source: SRC },
  'omega-speedmaster-moonwatch-sapphire': { retail: 7200, wholesale: 6000, currency: 'USD', grade: 'medium', demandScore: 70, updatedAt: D, source: SRC },
  'omega-speedmaster-silver-snoopy':      { retail: 14000, wholesale: 11000, currency: 'USD', grade: 'fast', demandScore: 80, updatedAt: D, source: SRC },
  // ---- Cartier ----
  'cartier-santos-wssa0009':        { retail: 7400,  wholesale: 6100,  currency: 'USD', grade: 'medium', demandScore: 60, updatedAt: D, source: SRC },
};

// ----------------- Heuristic estimator (covers the rest of the catalog) -----------------

/** Orientative base retail (USD) by "brandId|collection"; falls back to brand. */
const COLLECTION_BASE: Readonly<Record<string, number>> = {
  'rolex|Submariner': 12000, 'rolex|GMT-Master II': 16000, 'rolex|GMT-Master': 14000,
  'rolex|Daytona': 30000, 'rolex|Datejust': 8500, 'rolex|Day-Date': 38000,
  'rolex|Sky-Dweller': 16000, 'rolex|Explorer': 8000, 'rolex|Explorer II': 9500,
  'rolex|Yacht-Master': 14000, 'rolex|Sea-Dweller': 13000, 'rolex|Air-King': 7500,
  'rolex|Oyster Perpetual': 6500, 'rolex|Milgauss': 9000, 'rolex|Cellini': 12000,
  'patek-philippe|Nautilus': 60000, 'patek-philippe|Aquanaut': 45000, 'patek-philippe|Calatrava': 28000,
  'audemars-piguet|Royal Oak': 38000, 'audemars-piguet|Royal Oak Offshore': 35000,
  'omega|Speedmaster': 7000, 'omega|Seamaster': 6000, 'omega|Constellation': 5500,
  'omega|De Ville': 4500, 'omega|Railmaster': 5500,
  'cartier|Santos': 8000, 'cartier|Tank': 7000, 'cartier|Ballon Bleu': 7500,
};
const BRAND_BASE: Readonly<Record<string, number>> = {
  rolex: 10000, 'patek-philippe': 35000, 'audemars-piguet': 35000, omega: 6000, cartier: 7000,
};

const FAST = new Set(['Daytona', 'Submariner', 'GMT-Master II', 'Nautilus', 'Aquanaut', 'Royal Oak', 'Royal Oak Offshore']);
const MEDIUM = new Set(['Datejust', 'Sky-Dweller', 'Sea-Dweller', 'Yacht-Master', 'GMT-Master', 'Explorer', 'Explorer II', 'Speedmaster', 'Santos', 'Seamaster', 'Tank']);

function materialMultiplier(name: string): number {
  const n = name.toLowerCase();
  let m = 1;
  if (/platinum|pt950|\b950\b/.test(n)) m = 3.2;
  // Two-tone is checked BEFORE solid gold: a "steel & gold" piece (Rolesor)
  // must not be priced as solid gold just because its name contains "gold".
  else if (/rolesor|two[- ]tone|steel.*gold|gold.*steel/.test(n)) m = 1.5;
  else if (/everose|rose gold|pink gold/.test(n)) m = 2.6;
  // Catalog names are English; "\bor\b" (French/Spanish for gold) is omitted to
  // avoid matching the English conjunction "or".
  else if (/yellow gold|white gold|moonshine|canopus|sedna|18k|18ct|\bgold\b/.test(n)) m = 2.4;
  if (/diamond|pav[ée]|\bgem|baguette/.test(n)) m *= 1.8;
  return m;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function deriveMarketData(model: Model): MarketData {
  const base = COLLECTION_BASE[`${model.brandId}|${model.collection}`] ?? BRAND_BASE[model.brandId] ?? 6000;
  const mult = materialMultiplier(model.name);
  const h = hash(model.id);
  const variation = 0.9 + (h % 21) / 100; // ±10% deterministic spread
  const retail = Math.max(1500, Math.round((base * mult * variation) / 100) * 100);

  const grade: CommercializationGrade = FAST.has(model.collection) ? 'fast' : MEDIUM.has(model.collection) ? 'medium' : 'slow';
  const wholesaleFactor = grade === 'fast' ? 0.88 : grade === 'medium' ? 0.85 : 0.80;
  const wholesale = Math.round((retail * wholesaleFactor) / 100) * 100;

  const demandBase = grade === 'fast' ? 85 : grade === 'medium' ? 62 : 40;
  const demandScore = Math.max(15, Math.min(99, demandBase + ((h >> 4) % 11) - 5));

  return {
    modelId: model.id,
    retail,
    wholesale,
    currency: 'USD',
    grade,
    demandScore,
    updatedAt: D,
    source: 'Estimated from brand / collection / material — not a quote',
    estimated: true,
  };
}

/** Returns market data for a model id: curated if available, else estimated. */
export function getMarketData(modelId: string): MarketData | undefined {
  const e = CURATED[modelId];
  if (e) return { modelId, estimated: false, ...e };
  const model = ALL_MODELS.find((m) => m.id === modelId);
  return model ? deriveMarketData(model) : undefined;
}

/** Count of curated (hand-set) references. */
export const MARKET_DATA_COUNT = Object.keys(CURATED).length;
