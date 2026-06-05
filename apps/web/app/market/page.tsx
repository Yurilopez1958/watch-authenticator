'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_BRANDS,
  ALL_MODELS,
  getMarketData,
  type CommercializationGrade,
  type MarketEstimate,
} from '@watch-auth/core';
import { useOverride } from '@/lib/market-overrides';

const EUR_PER_USD = 0.92;

const GRADE_META: Record<CommercializationGrade, { label: string; color: string; bar: string }> = {
  fast:   { label: 'Fast mover · high liquidity', color: 'text-emerald-300', bar: 'linear-gradient(90deg,#10b981,#34d399)' },
  medium: { label: 'Medium rotation',             color: 'text-amber-300',   bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  slow:   { label: 'Slow market · low liquidity',  color: 'text-sky-300',     bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
};

type Source = 'override' | 'ai' | 'curated' | 'estimated';
type Valuation = { retail: number; wholesale: number; grade: CommercializationGrade; demandScore: number; source: Source; note: string };

const BADGE: Record<Source, { text: string; style: React.CSSProperties }> = {
  override:  { text: 'Your price', style: { color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)',  background: 'rgba(59,130,246,0.1)' } },
  ai:        { text: 'AI estimate', style: { color: '#c084fc', borderColor: 'rgba(168,85,247,0.4)',  background: 'rgba(168,85,247,0.1)' } },
  curated:   { text: 'Curated',     style: { color: '#34d399', borderColor: 'rgba(16,185,129,0.4)',  background: 'rgba(16,185,129,0.1)' } },
  estimated: { text: 'Estimated',   style: { color: '#fbbf24', borderColor: 'rgba(245,158,11,0.4)',  background: 'rgba(245,158,11,0.1)' } },
};

export default function MarketPage() {
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');

  // Catalog picker
  const [brandId, setBrandId] = useState<string>(ALL_BRANDS[0]!.id);
  const [modelSearch, setModelSearch] = useState('');
  const [modelId, setModelId] = useState<string>(ALL_MODELS[0]!.id);

  // Custom (any watch)
  const [ftBrand, setFtBrand] = useState('');
  const [ftModel, setFtModel] = useState('');
  const [ftRef, setFtRef] = useState('');

  // AI estimates cache + status
  const [aiCache, setAiCache] = useState<Record<string, MarketEstimate>>({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fetchSeqRef = useRef(0); // only the latest fetch controls busy/error
  const [sellEdited, setSellEdited] = useState(false); // user typed their own resale price

  // Dealer cost assumptions (persisted, USD)
  const [serviceUsd, setServiceUsd] = useState(500);
  const [listingUsd, setListingUsd] = useState(150);
  const [salesFeePct, setSalesFeePct] = useState(5);
  const [profitPct, setProfitPct] = useState(15);
  const [sellUsd, setSellUsd] = useState(0);

  useEffect(() => {
    const c = localStorage.getItem('market-currency');
    if (c === 'EUR' || c === 'USD') setCurrency(c);
    try {
      const s = JSON.parse(localStorage.getItem('dealer-settings') ?? '{}') as Partial<{ serviceUsd: number; listingUsd: number; salesFeePct: number; profitPct: number }>;
      if (typeof s.serviceUsd === 'number') setServiceUsd(s.serviceUsd);
      if (typeof s.listingUsd === 'number') setListingUsd(s.listingUsd);
      if (typeof s.salesFeePct === 'number') setSalesFeePct(s.salesFeePct);
      if (typeof s.profitPct === 'number') setProfitPct(s.profitPct);
    } catch { /* noop */ }
  }, []);
  const pickCurrency = (c: 'USD' | 'EUR') => { setCurrency(c); localStorage.setItem('market-currency', c); };
  useEffect(() => {
    localStorage.setItem('dealer-settings', JSON.stringify({ serviceUsd, listingUsd, salesFeePct, profitPct }));
  }, [serviceUsd, listingUsd, salesFeePct, profitPct]);

  // Catalog filtering
  const brandModels = useMemo(() => ALL_MODELS.filter((m) => m.brandId === brandId), [brandId]);
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase().replace(/\s+/g, '');
    return brandModels.filter((m) => !q
      || m.reference.toLowerCase().replace(/\s+/g, '').includes(q)
      || m.name.toLowerCase().includes(q)
      || m.collection.toLowerCase().includes(q));
  }, [brandModels, modelSearch]);
  const group = (list: typeof ALL_MODELS[number][]) => {
    const g = new Map<string, typeof ALL_MODELS[number][]>();
    for (const m of list) { const a = g.get(m.collection) ?? []; a.push(m); g.set(m.collection, a); }
    return Array.from(g.entries());
  };
  const groupedModels = useMemo(() => group(filteredModels), [filteredModels]);
  const groupedAllModels = useMemo(() => group(brandModels), [brandModels]);
  useEffect(() => {
    if (!filteredModels.some((m) => m.id === modelId) && filteredModels.length > 0) setModelId(filteredModels[0]!.id);
  }, [filteredModels, modelId]);

  const currentModel = ALL_MODELS.find((m) => m.id === modelId);
  const currentBrand = ALL_BRANDS.find((b) => b.id === brandId)!;
  const { override, save, clear } = useOverride(modelId);

  // ----- AI estimate fetch -----
  const fetchEstimate = async (key: string, payload: { brand: string; model: string; reference?: string }, force = false) => {
    if (!force && aiCache[key]) return;
    const seq = ++fetchSeqRef.current;
    setAiBusy(true); setAiError(null);
    try {
      const res = await fetch('/api/market-estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (res.ok) setAiCache((p) => ({ ...p, [key]: j as MarketEstimate })); // cache any valid result
      if (seq === fetchSeqRef.current && !res.ok) setAiError(j.error ?? 'Market estimate failed.');
    } catch (e) {
      if (seq === fetchSeqRef.current) setAiError((e as Error).message);
    } finally {
      if (seq === fetchSeqRef.current) setAiBusy(false);
    }
  };

  // Auto-fetch a fresh market estimate when the catalog model changes.
  useEffect(() => {
    if (mode !== 'catalog' || !currentModel) return;
    void fetchEstimate(modelId, { brand: currentBrand.name, model: currentModel.name, reference: currentModel.reference });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, mode]);

  const customKey = `${ftBrand}|${ftModel}|${ftRef}`.toLowerCase().trim();

  // ----- Resolve the current valuation -----
  const val: Valuation | undefined = useMemo(() => {
    if (mode === 'custom') {
      const e = aiCache[customKey];
      return e ? { retail: e.retail, wholesale: e.wholesale, grade: e.grade, demandScore: e.demandScore, source: 'ai', note: e.note } : undefined;
    }
    if (override) return { retail: override.retail, wholesale: override.wholesale, grade: override.grade, demandScore: override.demandScore, source: 'override', note: 'Your saved figure' };
    const e = aiCache[modelId];
    if (e) return { retail: e.retail, wholesale: e.wholesale, grade: e.grade, demandScore: e.demandScore, source: 'ai', note: e.note };
    const base = getMarketData(modelId);
    return base ? { retail: base.retail, wholesale: base.wholesale, grade: base.grade, demandScore: base.demandScore, source: base.estimated ? 'estimated' : 'curated', note: base.source } : undefined;
  }, [mode, customKey, aiCache, override, modelId]);

  const title = mode === 'custom' ? `${ftBrand} ${ftModel}`.trim() : `${currentBrand.name} ${currentModel?.name ?? ''}`;
  const sub = mode === 'custom' ? ftRef : currentModel?.reference;

  // currency helpers
  const toDisp = (usd: number) => (currency === 'EUR' ? Math.round(usd * EUR_PER_USD) : usd);
  const toUsd = (v: number) => (currency === 'EUR' ? Math.round(v / EUR_PER_USD) : v);
  const money = (usd: number) => {
    try { return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(toDisp(usd)); }
    catch { return `${currency} ${toDisp(usd).toLocaleString()}`; }
  };

  // Default the resale price to the current valuation (including a late AI
  // estimate), but stop overwriting once the user has typed their own.
  useEffect(() => { setSellEdited(false); }, [modelId, mode, customKey]);
  useEffect(() => {
    if (val && !sellEdited) setSellUsd(val.retail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val?.retail, sellEdited, modelId, mode, customKey]);

  const margin = val ? val.retail - val.wholesale : 0;
  const marginPct = val && val.wholesale > 0 ? (margin / val.wholesale) * 100 : 0;
  const salesFee = sellUsd * (salesFeePct / 100);
  const netProceeds = sellUsd - salesFee;
  const invest = netProceeds / (1 + Math.max(0, profitPct) / 100);
  const offerUsd = invest - serviceUsd - listingUsd;
  const profitUsd = netProceeds - (offerUsd + serviceUsd + listingUsd);
  const viable = offerUsd > 0;

  // edit own price (catalog only)
  const [editing, setEditing] = useState(false);
  const [rIn, setRIn] = useState(''); const [wIn, setWIn] = useState(''); const [gIn, setGIn] = useState<CommercializationGrade>('medium');
  useEffect(() => { setEditing(false); }, [modelId, mode]);
  const openEdit = () => { if (!val) return; setRIn(String(toDisp(val.retail))); setWIn(String(toDisp(val.wholesale))); setGIn(val.grade); setEditing(true); };
  const doSave = () => {
    const retail = toUsd(parseFloat(rIn) || 0); const wholesale = toUsd(parseFloat(wIn) || 0);
    if (retail <= 0) return;
    save({ retail, wholesale, grade: gIn, demandScore: gIn === 'fast' ? 88 : gIn === 'medium' ? 62 : 40, updatedAt: new Date().toISOString().slice(0, 10) });
    setEditing(false);
  };

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">Market valuation</h1>
          <p className="text-muted text-sm max-w-2xl">
            Retail, wholesale and liquidity for any watch, plus a dealer offer calculator. Each search pulls a fresh
            <span className="text-accent-bright"> AI market estimate</span>.
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(['USD', 'EUR'] as const).map((c) => (
            <button key={c} onClick={() => pickCurrency(c)} className={`chip cursor-pointer ${currency === c ? '!bg-accent !text-white !border-transparent' : ''}`}>{c}</button>
          ))}
        </div>
      </section>

      {/* Mode */}
      <div className="flex gap-2">
        <button onClick={() => setMode('catalog')} className={`chip cursor-pointer ${mode === 'catalog' ? '!bg-accent !text-white !border-transparent' : ''}`}>Catalog brands</button>
        <button onClick={() => setMode('custom')} className={`chip cursor-pointer ${mode === 'custom' ? '!bg-accent !text-white !border-transparent' : ''}`}>Any watch (type it)</button>
      </div>

      {/* Picker */}
      {mode === 'catalog' ? (
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
      ) : (
        <section className="card p-5 space-y-3">
          <p className="text-xs text-muted">Value any watch from any brand — type it and the AI estimates the current market.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block"><span className="block text-xs uppercase tracking-wide text-dim mb-1">Brand</span><input value={ftBrand} onChange={(e) => setFtBrand(e.target.value)} className="field" placeholder="Vacheron Constantin" /></label>
            <label className="block"><span className="block text-xs uppercase tracking-wide text-dim mb-1">Model</span><input value={ftModel} onChange={(e) => setFtModel(e.target.value)} className="field" placeholder="Overseas" /></label>
            <label className="block"><span className="block text-xs uppercase tracking-wide text-dim mb-1">Reference (optional)</span><input value={ftRef} onChange={(e) => setFtRef(e.target.value)} className="field font-mono" placeholder="4500V" /></label>
          </div>
          <button
            onClick={() => ftBrand && ftModel && void fetchEstimate(customKey, { brand: ftBrand, model: ftModel, reference: ftRef }, true)}
            disabled={!ftBrand.trim() || !ftModel.trim() || aiBusy}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiBusy ? 'Estimating…' : 'Get market estimate'}
          </button>
        </section>
      )}

      {aiError && <div className="card p-3 border-l-4 border-l-amber-500 text-sm text-amber-300">{aiError} {mode === 'catalog' && '(showing heuristic estimate instead).'}</div>}

      {/* Valuation */}
      {val && (
        <section className="rounded-2xl border border-blue-500/30 p-5 space-y-5" style={{ background: 'linear-gradient(160deg,#0b1b44,#0a1024)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-blue-100/80 font-semibold">{title} {sub && <span className="text-blue-200/50 font-normal">· {sub}</span>}</span>
            <div className="flex items-center gap-2">
              {aiBusy && <span className="text-[0.65rem] text-blue-200/50">updating…</span>}
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border" style={BADGE[val.source].style}>{BADGE[val.source].text}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Retail (market)</div><div className="text-3xl font-bold font-mono text-blue-50">{money(val.retail)}</div></div>
            <div><div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Wholesale (dealer)</div><div className="text-3xl font-bold font-mono text-blue-50">{money(val.wholesale)}</div></div>
            <div><div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">Margin</div><div className="text-3xl font-bold font-mono text-emerald-300">{money(margin)}</div><div className="text-[0.7rem] text-blue-200/60">+{marginPct.toFixed(0)}%</div></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase tracking-wide text-blue-200/60">Commercialization</span>
              <span className={`text-sm font-semibold ${GRADE_META[val.grade].color}`}>{GRADE_META[val.grade].label}</span>
            </div>
            <div className="h-3 rounded-full bg-blue-950/70 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${val.demandScore}%`, background: GRADE_META[val.grade].bar }} /></div>
            <div className="flex justify-between text-[0.65rem] text-blue-200/50 mt-1"><span>Slow</span><span>Demand {val.demandScore}/100</span><span>Fast</span></div>
          </div>

          {val.note && <div className="text-[0.7rem] text-blue-200/50">{val.note}</div>}

          <div className="flex items-center gap-3 flex-wrap border-t border-blue-500/15 pt-3">
            {mode === 'catalog' && currentModel && (
              <button onClick={() => void fetchEstimate(modelId, { brand: currentBrand.name, model: currentModel.name, reference: currentModel.reference }, true)} disabled={aiBusy} className="btn-ghost text-sm disabled:opacity-50">
                {aiBusy ? 'Refreshing…' : '↻ Refresh AI estimate'}
              </button>
            )}
            {mode === 'catalog' && !editing && <button onClick={openEdit} className="btn-ghost text-sm">{override ? 'Edit your price' : 'Set your own price'}</button>}
            {mode === 'catalog' && override && <button onClick={clear} className="btn-ghost text-sm">Reset</button>}
          </div>

          {editing && (
            <div className="border-t border-blue-500/15 pt-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label={`Retail (${currency})`} value={parseFloat(rIn) || 0} onChange={(v) => setRIn(String(v))} />
                <Field label={`Wholesale (${currency})`} value={parseFloat(wIn) || 0} onChange={(v) => setWIn(String(v))} />
                <label className="block"><span className="block text-[0.7rem] uppercase tracking-wide text-dim mb-1">Commercialization</span>
                  <select value={gIn} onChange={(e) => setGIn(e.target.value as CommercializationGrade)} className="field text-sm py-1.5">
                    <option value="fast">Fast mover</option><option value="medium">Medium rotation</option><option value="slow">Slow market</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2"><button onClick={doSave} className="btn-primary text-sm">Save my price</button><button onClick={() => setEditing(false)} className="btn-ghost text-sm">Cancel</button></div>
            </div>
          )}
        </section>
      )}

      {/* Dealer offer calculator */}
      {val && (
        <section className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Dealer offer — what to pay</h2>
            <p className="text-xs text-muted">Works back from the resale price through your service cost, cost to bring it to market, the sales fee and your target profit (≥&nbsp;15%) to the maximum buy offer.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label={`Sell at (${currency})`} value={toDisp(sellUsd)} onChange={(v) => { setSellUsd(toUsd(v)); setSellEdited(true); }} />
            <Field label={`Service cost (${currency})`} value={toDisp(serviceUsd)} onChange={(v) => setServiceUsd(toUsd(v))} />
            <Field label={`To market (${currency})`} value={toDisp(listingUsd)} onChange={(v) => setListingUsd(toUsd(v))} />
            <Field label="Sales fee (%)" value={salesFeePct} onChange={setSalesFeePct} step="0.5" />
            <Field label="Profit (%)" value={profitPct} onChange={setProfitPct} hint="min 15%" />
          </div>
          <div className="rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between flex-wrap gap-3">
            <div><div className="text-xs uppercase tracking-wide text-dim">Max offer to the seller</div><div className="text-4xl font-bold font-mono text-emerald-300">{viable ? money(offerUsd) : '—'}</div></div>
            {!viable && <div className="text-xs text-red-300 max-w-[15rem]">Costs + profit exceed the resale price — don&apos;t buy at these numbers.</div>}
          </div>
          <div className="text-xs text-muted space-y-1">
            <Row label="Resale price" val={money(sellUsd)} />
            <Row label={`Sales fee (${salesFeePct}%)`} val={`− ${money(salesFee)}`} />
            <Row label="Service" val={`− ${money(serviceUsd)}`} />
            <Row label="To market" val={`− ${money(listingUsd)}`} />
            <Row label={`Your profit (${profitPct}%)`} val={`− ${money(profitUsd)}`} />
            <div className="border-t border-soft mt-1 pt-1"><Row label="= Max offer" val={viable ? money(offerUsd) : '—'} strong /></div>
          </div>
        </section>
      )}

      <p className="text-xs text-dim">AI estimates are orientative, not live quotes. A true real-time feed (Chrono24 / WatchCharts) needs a paid API — we can wire it when you have a key.</p>
    </div>
  );
}

function Field({ label, value, onChange, step, hint }: { label: string; value: number; onChange: (v: number) => void; step?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[0.7rem] uppercase tracking-wide text-dim mb-1">{label}</span>
      <input type="number" step={step ?? '1'} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="field text-sm py-1.5" />
      {hint && <span className="block text-[0.65rem] text-dim mt-0.5">{hint}</span>}
    </label>
  );
}

function Row({ label, val, strong }: { label: string; val: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between font-mono ${strong ? 'text-foreground font-semibold' : ''}`}>
      <span>{label}</span><span>{val}</span>
    </div>
  );
}
