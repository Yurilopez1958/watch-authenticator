'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ALL_BRANDS,
  ALL_MODELS,
  getMarketData,
  MARKET_DATA_COUNT,
  type CommercializationGrade,
} from '@watch-auth/core';

const GRADE_META: Record<CommercializationGrade, { label: string; color: string; bar: string }> = {
  fast:   { label: 'Fast mover · high liquidity', color: 'text-emerald-300', bar: 'linear-gradient(90deg,#10b981,#34d399)' },
  medium: { label: 'Medium rotation',             color: 'text-amber-300',   bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  slow:   { label: 'Slow market · low liquidity',  color: 'text-sky-300',     bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
};

function money(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export default function MarketPage() {
  const [brandId, setBrandId] = useState<string>(ALL_BRANDS[0]!.id);
  const [modelSearch, setModelSearch] = useState('');
  const [modelId, setModelId] = useState<string>(ALL_MODELS[0]!.id);

  const brandModels = useMemo(() => ALL_MODELS.filter((m) => m.brandId === brandId), [brandId]);
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase().replace(/\s+/g, '');
    return brandModels.filter((m) => {
      if (!q) return true;
      return (
        m.reference.toLowerCase().replace(/\s+/g, '').includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.collection.toLowerCase().includes(q)
      );
    });
  }, [brandModels, modelSearch]);

  const group = (list: typeof ALL_MODELS[number][]) => {
    const groups = new Map<string, typeof ALL_MODELS[number][]>();
    for (const m of list) { const arr = groups.get(m.collection) ?? []; arr.push(m); groups.set(m.collection, arr); }
    return Array.from(groups.entries());
  };
  const groupedModels = useMemo(() => group(filteredModels), [filteredModels]);
  const groupedAllModels = useMemo(() => group(brandModels), [brandModels]);

  useEffect(() => {
    if (!filteredModels.some((m) => m.id === modelId) && filteredModels.length > 0) {
      setModelId(filteredModels[0]!.id);
    }
  }, [filteredModels, modelId]);

  const currentModel = ALL_MODELS.find((m) => m.id === modelId);
  const currentBrand = ALL_BRANDS.find((b) => b.id === brandId)!;
  const data = getMarketData(modelId);

  const margin = data ? data.retail - data.wholesale : 0;
  const marginPct = data && data.wholesale > 0 ? (margin / data.wholesale) * 100 : 0;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">Market valuation</h1>
        <p className="text-muted text-sm max-w-2xl">
          Look up a model&apos;s <span className="text-accent-bright">retail</span> (secondary-market) and
          <span className="text-accent-bright"> wholesale</span> (dealer) price, plus how quickly it sells.
        </p>
      </section>

      {/* Model picker */}
      <section className="card p-5 space-y-4">
        <div>
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">Brand</span>
          <div className="flex flex-wrap gap-2">
            {ALL_BRANDS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBrandId(b.id)}
                className={`chip cursor-pointer ${brandId === b.id ? '!bg-accent !text-white !border-transparent' : ''}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">Search model or reference</span>
          <input
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            className="field font-mono"
            placeholder='e.g. "126610LN", "Nautilus", "Daytona"...'
          />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">Model</span>
          <select
            value={modelId}
            onChange={(e) => { setModelId(e.target.value); setModelSearch(''); }}
            className="field"
          >
            {(filteredModels.length > 0 ? groupedModels : groupedAllModels).map(([collection, models]) => (
              <optgroup key={collection} label={collection}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.reference}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="text-xs text-dim">
          {currentModel ? <>Selected: <span className="text-muted">{currentBrand.name} {currentModel.name} ({currentModel.reference})</span></> : 'Pick a model.'}
        </div>
      </section>

      {/* Valuation */}
      {data ? (
        <section className="rounded-2xl border border-blue-500/30 p-5 space-y-5" style={{ background: 'linear-gradient(160deg,#0b1b44,#0a1024)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-blue-100/80 font-semibold">
              {currentBrand.name} {currentModel?.name} <span className="text-blue-200/50 font-normal">· {currentModel?.reference}</span>
            </span>
            <span
              className="text-[0.65rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border"
              style={data.estimated
                ? { color: '#fbbf24', borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)' }
                : { color: '#34d399', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)' }}
            >
              {data.estimated ? 'Estimated' : 'Curated'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Retail (market)</div>
              <div className="text-3xl font-bold font-mono text-blue-50">{money(data.retail, data.currency)}</div>
            </div>
            <div>
              <div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Wholesale (dealer)</div>
              <div className="text-3xl font-bold font-mono text-blue-50">{money(data.wholesale, data.currency)}</div>
            </div>
            <div>
              <div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Margin</div>
              <div className="text-3xl font-bold font-mono text-emerald-300">{money(margin, data.currency)}</div>
              <div className="text-[0.7rem] text-blue-200/60">+{marginPct.toFixed(0)}%</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase tracking-wide text-blue-200/60">Commercialization</span>
              <span className={`text-sm font-semibold ${GRADE_META[data.grade].color}`}>{GRADE_META[data.grade].label}</span>
            </div>
            <div className="h-3 rounded-full bg-blue-950/70 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${data.demandScore}%`, background: GRADE_META[data.grade].bar }} />
            </div>
            <div className="flex justify-between text-[0.65rem] text-blue-200/50 mt-1">
              <span>Slow</span><span>Demand {data.demandScore}/100</span><span>Fast</span>
            </div>
          </div>

          <div className="text-[0.7rem] text-blue-200/50 border-t border-blue-500/15 pt-3">
            Updated {data.updatedAt} · {data.source}. Figures are orientative — confirm against live market data before trading.
          </div>
        </section>
      ) : (
        <section className="card p-6 text-sm text-dim">
          No market data on file for this model yet. The demo set currently covers {MARKET_DATA_COUNT} popular references —
          pick one of those (e.g. a Submariner, Daytona, Nautilus or Royal Oak), or we can add more.
        </section>
      )}
    </div>
  );
}
