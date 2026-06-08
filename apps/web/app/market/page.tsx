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
import { useLang } from '@/lib/i18n';
import { usePro } from '@/lib/pro';
import { useBrandExpenses, computeBrandPricing } from '@/lib/brand-expenses';
import { authedFetch } from '@/lib/billing-client';
import { handlePaywall } from '@/lib/paywall';
import { PaidGate } from '@/app/paid-gate';
import { AdminExpenses } from './admin-expenses';

const EUR_PER_USD = 0.92;

/** Bilingual string pair. */
type Bi = { es: string; en: string };

const GRADE_META: Record<CommercializationGrade, { label: Bi; color: string; bar: string }> = {
  fast:   { label: { es: 'Alta rotación · mucha liquidez', en: 'Fast mover · high liquidity' }, color: 'text-emerald-300', bar: 'linear-gradient(90deg,#10b981,#34d399)' },
  medium: { label: { es: 'Rotación media',                 en: 'Medium rotation'             }, color: 'text-amber-300',   bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
  slow:   { label: { es: 'Mercado lento · poca liquidez',  en: 'Slow market · low liquidity'  }, color: 'text-sky-300',     bar: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
};

type Source = 'override' | 'ai' | 'curated' | 'estimated';
type Valuation = { retail: number; wholesale: number; grade: CommercializationGrade; demandScore: number; source: Source; note: string };

const BADGE: Record<Source, { text: Bi; style: React.CSSProperties }> = {
  override:  { text: { es: 'Tu precio',     en: 'Your price' },  style: { color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)',  background: 'rgba(59,130,246,0.1)' } },
  ai:        { text: { es: 'Estimación IA', en: 'AI estimate' }, style: { color: '#c084fc', borderColor: 'rgba(168,85,247,0.4)',  background: 'rgba(168,85,247,0.1)' } },
  curated:   { text: { es: 'Curado',        en: 'Curated' },     style: { color: '#34d399', borderColor: 'rgba(16,185,129,0.4)',  background: 'rgba(16,185,129,0.1)' } },
  estimated: { text: { es: 'Estimado',      en: 'Estimated' },   style: { color: '#fbbf24', borderColor: 'rgba(245,158,11,0.4)',  background: 'rgba(245,158,11,0.1)' } },
};

export default function MarketPage() {
  const { t, lang } = useLang();
  const { pro } = usePro();
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

  // Per-brand purchase-price calculator
  const [priceBase, setPriceBase] = useState<'wholesale' | 'retail'>('wholesale');
  const [adminOpen, setAdminOpen] = useState(false);
  const { items: expenseItems } = useBrandExpenses(brandId);

  useEffect(() => {
    const c = localStorage.getItem('market-currency');
    if (c === 'EUR' || c === 'USD') setCurrency(c);
  }, []);
  const pickCurrency = (c: 'USD' | 'EUR') => { setCurrency(c); localStorage.setItem('market-currency', c); };

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
    const generic = t('La estimación no está disponible ahora mismo.', 'The estimate is not available right now.');
    const needLogin = t('Inicia sesión (en Planes) para la valoración precisa.', 'Sign in (in Plans) for the precise valuation.');
    setAiBusy(true); setAiError(null);
    try {
      const res = await authedFetch('/api/market-estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (await handlePaywall(res)) return; // 402/429/403 → paywall sheet (finally clears busy)
      if (res.status === 401) { if (seq === fetchSeqRef.current) setAiError(needLogin); return; } // not signed in
      // Parse defensively: a server/platform error can return an HTML page, not JSON.
      const raw = await res.text();
      let j: { error?: string; retail?: number } | null = null;
      try { j = raw ? JSON.parse(raw) : null; } catch { j = null; }

      if (res.ok && j && typeof j.retail === 'number') {
        setAiCache((p) => ({ ...p, [key]: j as MarketEstimate }));
      } else if (seq === fetchSeqRef.current) {
        setAiError(generic); // neutral message; never expose server text/tech
      }
    } catch {
      if (seq === fetchSeqRef.current) setAiError(generic);
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
    if (override) return { retail: override.retail, wholesale: override.wholesale, grade: override.grade, demandScore: override.demandScore, source: 'override', note: t('Tu cifra guardada', 'Your saved figure') };
    const e = aiCache[modelId];
    if (e) return { retail: e.retail, wholesale: e.wholesale, grade: e.grade, demandScore: e.demandScore, source: 'ai', note: e.note };
    const base = getMarketData(modelId);
    return base ? { retail: base.retail, wholesale: base.wholesale, grade: base.grade, demandScore: base.demandScore, source: base.estimated ? 'estimated' : 'curated', note: base.source } : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customKey, aiCache, override, modelId, lang]);

  const title = mode === 'custom' ? `${ftBrand} ${ftModel}`.trim() : `${currentBrand.name} ${currentModel?.name ?? ''}`;
  const sub = mode === 'custom' ? ftRef : currentModel?.reference;

  // currency helpers
  const toDisp = (usd: number) => (currency === 'EUR' ? Math.round(usd * EUR_PER_USD) : usd);
  const toUsd = (v: number) => (currency === 'EUR' ? Math.round(v / EUR_PER_USD) : v);
  const money = (usd: number) => {
    try { return new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(toDisp(usd)); }
    catch { return `${currency} ${toDisp(usd).toLocaleString()}`; }
  };

  const margin = val ? val.retail - val.wholesale : 0;
  const marginPct = val && val.wholesale > 0 ? (margin / val.wholesale) * 100 : 0;

  // Per-brand purchase-price calculation (USD base = wholesale or retail).
  const baseUsd = val ? (priceBase === 'retail' ? val.retail : val.wholesale) : 0;
  const pricing = computeBrandPricing(baseUsd, expenseItems);

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
    <PaidGate
      title={{ es: 'Mercado', en: 'Market' }}
      desc={{
        es: 'Valoración de venta, mayorista y liquidez de cualquier reloj, con calculadora de oferta para dealer.',
        en: 'Retail, wholesale and liquidity valuation for any watch, with a dealer offer calculator.',
      }}
    >
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('Valoración de mercado', 'Market valuation')}</h1>
          <p className="text-muted text-sm max-w-2xl">
            {t('Precio de venta, mayorista y liquidez de cualquier reloj, más una calculadora de oferta para dealer. Cada búsqueda trae una', 'Retail, wholesale and liquidity for any watch, plus a dealer offer calculator. Each search pulls a fresh')}
            <span className="text-accent-bright"> {t('estimación de mercado con IA', 'AI market estimate')}</span>.
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
        <button onClick={() => setMode('catalog')} className={`chip cursor-pointer ${mode === 'catalog' ? '!bg-accent !text-white !border-transparent' : ''}`}>{t('Marcas del catálogo', 'Catalog brands')}</button>
        <button onClick={() => setMode('custom')} className={`chip cursor-pointer ${mode === 'custom' ? '!bg-accent !text-white !border-transparent' : ''}`}>{t('Cualquier reloj (escríbelo)', 'Any watch (type it)')}</button>
      </div>

      {/* Picker */}
      {mode === 'catalog' ? (
        <section className="card p-5 space-y-4">
          <div>
            <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Marca', 'Brand')}</span>
            <div className="flex flex-wrap gap-2">
              {ALL_BRANDS.map((b) => (
                <button key={b.id} onClick={() => setBrandId(b.id)} className={`chip cursor-pointer ${brandId === b.id ? '!bg-accent !text-white !border-transparent' : ''}`}>{b.name}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Busca modelo o referencia', 'Search model or reference')}</span>
            <input value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} className="field font-mono" placeholder={t('p. ej. "126610LN", "Nautilus", "Daytona"...', 'e.g. "126610LN", "Nautilus", "Daytona"...')} />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Modelo', 'Model')}</span>
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
          <p className="text-xs text-muted">{t('Valora cualquier reloj de cualquier marca — escríbelo y la IA estima el mercado actual.', 'Value any watch from any brand — type it and the AI estimates the current market.')}</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block"><span className="block text-xs uppercase tracking-wide text-dim mb-1">{t('Marca', 'Brand')}</span><input value={ftBrand} onChange={(e) => setFtBrand(e.target.value)} className="field" placeholder="Vacheron Constantin" /></label>
            <label className="block"><span className="block text-xs uppercase tracking-wide text-dim mb-1">{t('Modelo', 'Model')}</span><input value={ftModel} onChange={(e) => setFtModel(e.target.value)} className="field" placeholder="Overseas" /></label>
            <label className="block"><span className="block text-xs uppercase tracking-wide text-dim mb-1">{t('Referencia (opcional)', 'Reference (optional)')}</span><input value={ftRef} onChange={(e) => setFtRef(e.target.value)} className="field font-mono" placeholder="4500V" /></label>
          </div>
          <button
            onClick={() => ftBrand && ftModel && void fetchEstimate(customKey, { brand: ftBrand, model: ftModel, reference: ftRef }, true)}
            disabled={!ftBrand.trim() || !ftModel.trim() || aiBusy}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiBusy ? t('Estimando…', 'Estimating…') : t('Obtener estimación de mercado', 'Get market estimate')}
          </button>
        </section>
      )}

      {aiError && <div className="card p-3 border-l-4 border-l-amber-500 text-sm text-amber-300">{aiError} {mode === 'catalog' && t('Mientras, te mostramos una estimación aproximada.', 'Meanwhile, here is an approximate estimate.')}</div>}

      {/* Valuation */}
      {val && (
        <section className="rounded-2xl border border-blue-500/30 p-5 space-y-5" style={{ background: 'linear-gradient(160deg,#0b1b44,#0a1024)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm text-blue-100/80 font-semibold">{title} {sub && <span className="text-blue-200/50 font-normal">· {sub}</span>}</span>
            <div className="flex items-center gap-2">
              {aiBusy && <span className="text-[0.65rem] text-blue-200/50">{t('actualizando…', 'updating…')}</span>}
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border" style={BADGE[val.source].style}>{BADGE[val.source].text[lang]}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">{t('Venta (mercado)', 'Retail (market)')}</div><div className="text-3xl font-bold font-mono text-blue-50">{money(val.retail)}</div></div>
            <div><div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">{t('Mayorista (dealer)', 'Wholesale (dealer)')}</div><div className="text-3xl font-bold font-mono text-blue-50">{money(val.wholesale)}</div></div>
            <div><div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">{t('Margen', 'Margin')}</div><div className="text-3xl font-bold font-mono text-emerald-300">{money(margin)}</div><div className="text-[0.7rem] text-blue-200/60">+{marginPct.toFixed(0)}%</div></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs uppercase tracking-wide text-blue-200/60">{t('Comercialización', 'Commercialization')}</span>
              <span className={`text-sm font-semibold ${GRADE_META[val.grade].color}`}>{GRADE_META[val.grade].label[lang]}</span>
            </div>
            <div className="h-3 rounded-full bg-blue-950/70 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${val.demandScore}%`, background: GRADE_META[val.grade].bar }} /></div>
            <div className="flex justify-between text-[0.65rem] text-blue-200/50 mt-1"><span>{t('Lento', 'Slow')}</span><span>{t('Demanda', 'Demand')} {val.demandScore}/100</span><span>{t('Rápido', 'Fast')}</span></div>
          </div>

          {val.note && <div className="text-[0.7rem] text-blue-200/50">{val.note}</div>}

          <div className="flex items-center gap-3 flex-wrap border-t border-blue-500/15 pt-3">
            {mode === 'catalog' && currentModel && (
              <button onClick={() => void fetchEstimate(modelId, { brand: currentBrand.name, model: currentModel.name, reference: currentModel.reference }, true)} disabled={aiBusy} className="btn-ghost text-sm disabled:opacity-50">
                {aiBusy ? t('Actualizando…', 'Refreshing…') : t('↻ Actualizar estimación IA', '↻ Refresh AI estimate')}
              </button>
            )}
            {pro && mode === 'catalog' && !editing && <button onClick={openEdit} className="btn-ghost text-sm">{override ? t('Editar tu precio', 'Edit your price') : t('Poner tu propio precio', 'Set your own price')}</button>}
            {pro && mode === 'catalog' && override && <button onClick={clear} className="btn-ghost text-sm">{t('Restablecer', 'Reset')}</button>}
          </div>

          {editing && (
            <div className="border-t border-blue-500/15 pt-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label={`${t('Venta', 'Retail')} (${currency})`} value={parseFloat(rIn) || 0} onChange={(v) => setRIn(String(v))} />
                <Field label={`${t('Mayorista', 'Wholesale')} (${currency})`} value={parseFloat(wIn) || 0} onChange={(v) => setWIn(String(v))} />
                <label className="block"><span className="block text-[0.7rem] uppercase tracking-wide text-dim mb-1">{t('Comercialización', 'Commercialization')}</span>
                  <select value={gIn} onChange={(e) => setGIn(e.target.value as CommercializationGrade)} className="field text-sm py-1.5">
                    <option value="fast">{t('Alta rotación', 'Fast mover')}</option><option value="medium">{t('Rotación media', 'Medium rotation')}</option><option value="slow">{t('Mercado lento', 'Slow market')}</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-2"><button onClick={doSave} className="btn-primary text-sm">{t('Guardar mi precio', 'Save my price')}</button><button onClick={() => setEditing(false)} className="btn-ghost text-sm">{t('Cancelar', 'Cancel')}</button></div>
            </div>
          )}
        </section>
      )}

      {/* Per-brand purchase price (Pro, catalog mode) — applies the brand's
          configured expense percentages to the base price. */}
      {pro && val && mode === 'catalog' && (
        <section className="card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">{t('Precio de compra por marca', 'Per-brand purchase price')}</h2>
              <p className="text-xs text-muted">{t(`Aplica los gastos configurados para ${currentBrand.name} sobre el precio base.`, `Applies the expenses set for ${currentBrand.name} to the base price.`)}</p>
            </div>
            <button onClick={() => setAdminOpen(true)} className="btn-ghost text-sm inline-flex items-center gap-1.5 shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              {t('Administración', 'Admin')}
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-dim uppercase tracking-wide">{t('Base', 'Base')}</span>
            {(['wholesale', 'retail'] as const).map((b) => (
              <button key={b} onClick={() => setPriceBase(b)} className={`chip cursor-pointer ${priceBase === b ? '!bg-accent !text-white !border-transparent' : ''}`}>
                {b === 'wholesale' ? t('Mayorista', 'Wholesale') : t('Venta', 'Retail')} · {money(b === 'wholesale' ? val.wholesale : val.retail)}
              </button>
            ))}
          </div>

          {expenseItems.filter((i) => i.active && i.percent > 0).length === 0 ? (
            <div className="text-sm text-amber-300/90">
              {t(`No hay gastos configurados para ${currentBrand.name}.`, `No expenses configured for ${currentBrand.name}.`)}{' '}
              <button onClick={() => setAdminOpen(true)} className="underline">{t('Configúralos', 'Set them up')}</button>.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5">
                  <div className="text-xs uppercase tracking-wide text-dim">{t('Precio de compra', 'Purchase price')}</div>
                  <div className="text-3xl font-bold font-mono text-emerald-300">{pricing.over100 ? '—' : money(pricing.purchase)}</div>
                  <div className="text-[0.65rem] text-dim mt-0.5">{t('base menos gastos', 'base minus expenses')} ({pricing.sumPct.toFixed(1)}%)</div>
                </div>
                <div className="rounded-xl p-4 border border-amber-500/30 bg-amber-500/5">
                  <div className="text-xs uppercase tracking-wide text-dim">{t('Coste total', 'Total cost')}</div>
                  <div className="text-3xl font-bold font-mono text-amber-300">{money(pricing.totalCost)}</div>
                  <div className="text-[0.65rem] text-dim mt-0.5">{t('base más gastos', 'base plus expenses')} ({pricing.sumPct.toFixed(1)}%)</div>
                </div>
                <div className="rounded-xl p-4 border border-soft">
                  <div className="text-xs uppercase tracking-wide text-dim">{t('Base', 'Base')}</div>
                  <div className="text-3xl font-bold font-mono text-blue-50">{money(baseUsd)}</div>
                  <div className="text-[0.65rem] text-dim mt-0.5">{priceBase === 'wholesale' ? t('mayorista', 'wholesale') : t('venta', 'retail')}</div>
                </div>
              </div>
              {pricing.over100 && <div className="text-xs text-red-300">{t('Los gastos suman 100% o más. Revisa los porcentajes en Administración.', 'Expenses total 100% or more. Review the percentages in Admin.')}</div>}
              <div className="text-xs text-muted space-y-1 border-t border-soft pt-3">
                <Row label={t('Precio base', 'Base price')} val={money(baseUsd)} />
                {pricing.breakdown.map((b, i) => (
                  <Row key={i} label={`${b.label} (${b.percent.toFixed(1)}%)`} val={money(b.amount)} />
                ))}
                <div className="border-t border-soft mt-1 pt-1"><Row label={t('= Gastos totales', '= Total expenses')} val={`${pricing.sumPct.toFixed(1)}%`} strong /></div>
              </div>
            </>
          )}
        </section>
      )}

      <AdminExpenses open={adminOpen} onClose={() => setAdminOpen(false)} initialBrandId={brandId} />

      <p className="text-xs text-dim">{t('Las estimaciones son orientativas, no cotizaciones en vivo. Una fuente de mercado en tiempo real requiere una integración de pago — se puede conectar más adelante.', 'Estimates are orientative, not live quotes. A real-time market source requires a paid integration — it can be connected later.')}</p>
    </div>
    </PaidGate>
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
