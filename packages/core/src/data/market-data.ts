// Market intelligence (valuation) — Phase 1.
// MOCK / orientative figures to demo the feature. Structured so it can later be
// swapped for a Supabase table or a real market API (Chrono24 / WatchCharts)
// without changing the UI. Prices in USD; refine with real data.

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
};

type Entry = Omit<MarketData, 'modelId'>;

const D = '2025-06-01';
const SRC = 'Orientative (mock) — refine with real market data';

/** Seed of popular references. Keyed by catalog model id. */
const MARKET_DATA: Readonly<Record<string, Entry>> = {
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

/** Returns market data for a model id, or undefined if not on file. */
export function getMarketData(modelId: string): MarketData | undefined {
  const e = MARKET_DATA[modelId];
  return e ? { modelId, ...e } : undefined;
}

/** Count of models with market data (for UI hints). */
export const MARKET_DATA_COUNT = Object.keys(MARKET_DATA).length;
