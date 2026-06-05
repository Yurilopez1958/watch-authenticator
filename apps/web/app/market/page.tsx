'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ALL_BRANDS,
  ALL_MODELS,
  getMarketData,
  type CommercializationGrade,
  type MarketData,
} from '@watch-auth/core';
import { useOverride } from '@/lib/market-overrides';

const EUR_PER_USD = 0.92; // approximate display rate

const GRADE_META: Record<CommercializationGrade, { label: string; color: string; bar: string }> = {
  fast:   { label: 'Fast mover · high liquidity', color: 'text-emerald-300', bar: 'linear-gradient(90deg,#10b981,#34d399)' },
  medium: { label: 'Medium rotation',             color: 'text-amber-300',   bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  slow:   { label: 'Slow market · low liquidity',  color: 'text-sky-300',     bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
};

export default function MarketPage() {
  const [brandId, setBrandId] = useState<string>(ALL_BRANDS[0]!.id);
  const [modelSearch, setModelSearch] = useState('');
  const [modelId, setModelId] = useState<string>(ALL_MODELS[0]!.id);
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');

  useEffect(() => {
    const c = localStorage.getItem('market-currency');
    if (c === 'EUR' || c === 'USD') setCurrency(c);
  }, []);
  const pickCurrency = (c: 'USD' | 'EUR') => { setCurrency(c); localStorage.setItem('market-currency', c); };

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

  const { override, save, clear } = useOverride(modelId);
  const base = getMarketData(modelId);
  const data: MarketData | undefined = base
    ? (override
        ? { ...base, retail: override.retail, wholesale: override.wholesale, grade: override.grade, demandScore: override.demandScore, estimated: false, updatedAt: override.updatedAt, source: 'Your own figure' }
        : base)
    : undefined;

  // currency helpers (data stored in USD)
  const toDisp = (usd: number) => (currency === 'EUR' ? Math.round(usd * EUR_PER_USD) : usd);
  const toUsd = (v: number) => (currency === 'EUR' ? Math.round(v / EUR_PER_USD) : v);
  const money = (usd: number) => {
    try { return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(toDisp(usd)); }
    catch { return `${currency} ${toDisp(usd).toLocaleString()}`; }
  };

  const margin = data ? data.retail - data.wholesale : 0;
  const marginPct = data && data.wholesale > 0 ? (margin / data.wholesale) * 100 : 0;

  // ---- edit own prices ----
  const [editing, setEditing] = useState(false);
  const [rIn, setRIn] = useState('');
  const [wIn, setWIn] = useState('');
  const [gIn, setGIn] = useState<CommercializationGrade>('medium');
  useEffect(() => { setEditing(false); }, [modelId]);

  const openEdit = () => {
    if (!data) return;
    setRIn(String(toDisp(data.retail)));
    setWIn(String(toDisp(data.wholesale)));
    setGIn(data.grade);
    setEditing(true);
  };
  const doSave = () => {
    const retail = toUsd(parseFloat(rIn) || 0);
    const wholesale = toUsd(parseFloat(wIn) || 0);
    if (retail <= 0) return;
    const demandScore = gIn === 'fast' ? 88 : gIn === 'medium' ? 62 : 40;
    save({ retail, wholesale, grade: gIn, demandScore, updatedAt: new Date().toISOString().slice(0, 10) });
    setEditing(false);
  };

  const badge = override
    ? { text: 'Your price', style: { color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.1)' } }
    : base?.estimated
      ? { text: 'Estimated', style: { color: '#fbbf24', borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)' } }
      : { text: 'Curated', style: { color: '#34d399', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)' } };

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">Market valuation</h1>
          <p className="text-muted text-sm max-w-2xl">
            Look up a model&apos;s <span className="text-accent-bright">retail</span> (secondary-market) and
            <span className="text-accent-bright"> wholesale</span> (dealer) price, plus how quickly it sells.
            Set your own figures to override the estimates.
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(['USD', 'EUR'] as const).map((c) => (
            <button key={c} onClick={() => pickCurrency(c)} className={`chip cursor-pointer ${currency === c ? '!bg-accent !text-white !border-transparent' : ''}`}>{c}</button>
          ))}
        </div>
      </section>

      {/* Model picker */}
      <section className="card p-5 space-y-4">
        <div>
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">Brand</span>
          <div className="flex flex-wrap gap-2">
            {ALL_BRANDS.map((b) => (
              <button key={b.id} onClick={() => setBrandId(b.id)} className={`chip cursor-pointer ${brandId === b.id ? '!bg-accent !text-white !border-transparent' : ''}`}>{b.name}</button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">Search model or reference</span>
          <input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} className="field font-mono" placeholder='e.g. "126610LN", "Nautilus", "Daytona"...' />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">Model</span>
          <select value={modelId} onChange={(e) => { setModelId(e.target.value); setModelSearch(''); }} className="field">
            {(filteredModels.length > 0 ? groupedModels : groupedAllModels).map(([collection, models]) => (
              <optgroup key={collection} label={collection}>
                {models.map((m) => (<option key={m.id} value={m.id}>{m.name} — {m.reference}</option>))}
              </optgroup>
            ))}
          </select>
        </label>
      </section>

      {/* Valuation */}
      {data && (
        <section className="rounded-2xl border border-blue-500/30 p-5 space-y-5" style={{ background: 'linear-gradient(160deg,#0b1b44,#0a1024)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-blue-100/80 font-semibold">
              {currentBrand.name} {currentModel?.name} <span className="text-blue-200/50 font-normal">· {currentModel?.reference}</span>
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border" style={badge.style}>{badge.text}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Retail (market)</div>
              <div className="text-3xl font-bold font-mono text-blue-50">{money(data.retail)}</div>
            </div>
            <div>
              <div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Wholesale (dealer)</div>
              <div className="text-3xl font-bold font-mono text-blue-50">{money(data.wholesale)}</div>
            </div>
            <div>
              <div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Margin</div>
              <div className="text-3xl font-bold font-mono text-emerald-300">{money(margin)}</div>
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

          {/* Edit own prices */}
          {!editing ? (
            <div className="flex items-center gap-3 flex-wrap border-t border-blue-500/15 pt-3">
              <button onClick={openEdit} className="btn-primary text-sm inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                {override ? 'Edit your price' : 'Set your own price'}
              </button>
              {override && <button onClick={clear} className="btn-ghost text-sm">Reset to default</button>}
              <span className="text-[0.7rem] text-blue-200/50">
                {data.source} · updated {data.updatedAt}{currency === 'EUR' ? ` · EUR ≈ USD × ${EUR_PER_USD}` : ''}
              </span>
            </div>
          ) : (
            <div className="border-t border-blue-500/15 pt-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-[0.7rem] uppercase tracking-wide text-blue-200/60 mb-1">Retail ({currency})</span>
                  <input type="number" value={rIn} onChange={(e) => setRIn(e.target.value)} className="field text-sm py-1.5" />
                </label>
                <label className="block">
                  <span className="block text-[0.7rem] uppercase tracking-wide text-blue-200/60 mb-1">Wholesale ({currency})</span>
                  <input type="number" value={wIn} onChange={(e) => setWIn(e.target.value)} className="field text-sm py-1.5" />
                </label>
                <label className="block">
                  <span className="block text-[0.7rem] uppercase tracking-wide text-blue-200/60 mb-1">Commercialization</span>
                  <select value={gIn} onChange={(e) => setGIn(e.target.value as CommercializationGrade)} className="field text-sm py-1.5">
                    <option value="fast">Fast mover</option>
                    <option value="medium">Medium rotation</option>
                    <option value="slow">Slow market</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={doSave} className="btn-primary text-sm">Save my price</button>
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
