'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ALL_BRANDS,
  ALL_MODELS,
  bestProfileMatch,
  getReferenceProfilesForBrand,
  type ElementReading,
  type ElementSymbol,
  type MatchResult,
  type XRFMeasurement,
} from '@watch-auth/core';
import { parseDecimal } from '@/lib/num';
import { MetalModeBanner } from '@/app/metal-mode-banner';
import { useLang } from '@/lib/i18n';
import { usePro } from '@/lib/pro';

/** Bilingual string pair. */
type Bi = { es: string; en: string };

/** Year selector restricted to a model's production range. */
function YearPicker({ years, value, onChange }: { years: number[]; value: number; onChange: (y: number) => void }) {
  const { t } = useLang();
  if (years.length === 0) return <div className="text-sm text-dim">{t('No hay años de producción registrados.', 'No production years on file.')}</div>;
  if (years.length > 18) {
    return (
      <select value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} className="field">
        {years.map((y) => (<option key={y} value={y}>{y}</option>))}
      </select>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {years.map((y) => (
        <button
          key={y}
          onClick={() => onChange(y)}
          className={`chip cursor-pointer ${value === y ? '!bg-accent !text-white !border-transparent' : ''}`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}

const ELEMENTS_OF_INTEREST: ElementSymbol[] = [
  'Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si',
  'Au', 'Ag', 'Pt', 'Pd', 'Ru',
];

const verdictLabel: Record<MatchResult['verdict'], { text: Bi; color: string; ring: string }> = {
  'likely-authentic': { text: { es: 'Probablemente auténtico', en: 'Likely authentic' }, color: 'text-emerald-300', ring: 'ring-emerald-500/30 bg-emerald-500/10' },
  'inconclusive':     { text: { es: 'No concluyente',          en: 'Inconclusive'     }, color: 'text-amber-300',   ring: 'ring-amber-500/30 bg-amber-500/10' },
  'likely-fake':      { text: { es: 'Probablemente falso',     en: 'Likely fake'      }, color: 'text-red-300',     ring: 'ring-red-500/30 bg-red-500/10' },
};

export default function VerifyPage() {
  const { t, lang } = useLang();
  const { pro } = usePro();
  const [brandId, setBrandId] = useState<string>(ALL_BRANDS[0]!.id);
  const [audience, setAudience] = useState<'all' | 'men' | 'women' | 'unisex'>('all');
  const [modelSearch, setModelSearch] = useState('');
  const [modelId, setModelId] = useState<string>(ALL_MODELS[0]!.id);
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [result, setResult] = useState<MatchResult | null>(null);

  const brandModels = useMemo(() => ALL_MODELS.filter((m) => m.brandId === brandId), [brandId]);
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase().replace(/\s+/g, '');
    return brandModels.filter((m) => {
      if (audience !== 'all' && m.audience !== audience) return false;
      if (!q) return true;
      return (
        m.reference.toLowerCase().replace(/\s+/g, '').includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.collection.toLowerCase().includes(q)
      );
    });
  }, [brandModels, audience, modelSearch]);
  const groupedModels = useMemo(() => {
    const groups = new Map<string, typeof ALL_MODELS[number][]>();
    for (const m of filteredModels) {
      const arr = groups.get(m.collection) ?? [];
      arr.push(m);
      groups.set(m.collection, arr);
    }
    return Array.from(groups.entries());
  }, [filteredModels]);
  const groupedAllModels = useMemo(() => {
    const groups = new Map<string, typeof ALL_MODELS[number][]>();
    for (const m of brandModels) {
      const arr = groups.get(m.collection) ?? [];
      arr.push(m);
      groups.set(m.collection, arr);
    }
    return Array.from(groups.entries());
  }, [brandModels]);
  const currentBrand = ALL_BRANDS.find((b) => b.id === brandId)!;
  const currentModel = ALL_MODELS.find((m) => m.id === modelId);

  // Years this model was produced (newest first); keep selected year in range
  const productionYears = useMemo(() => {
    const cur = new Date().getFullYear();
    const m = ALL_MODELS.find((x) => x.id === modelId);
    if (!m) return [] as number[];
    const end = Math.min(m.yearEnd ?? cur, cur);
    const years: number[] = [];
    for (let y = end; y >= m.yearStart; y--) years.push(y);
    return years;
  }, [modelId]);
  useEffect(() => {
    if (productionYears.length > 0 && !productionYears.includes(year)) {
      setYear(productionYears[0]!);
    }
  }, [productionYears, year]);

  const candidateProfiles = useMemo(
    () => getReferenceProfilesForBrand(brandId, year),
    [brandId, year],
  );

  // Reset model when brand changes if current is no longer valid.
  // (An effect, not a memo — memos must be pure and must not call setState.)
  useEffect(() => {
    if (!brandModels.some((m) => m.id === modelId) && brandModels.length > 0) {
      setModelId(brandModels[0]!.id);
    }
  }, [brandModels, modelId]);

  // Clear a stale verdict whenever the watch under test changes, so the result
  // panel never shows last watch's verdict against a newly-selected one.
  useEffect(() => {
    setResult(null);
  }, [brandId, modelId, year]);

  const onAnalyze = () => {
    const elementReadings: ElementReading[] = Object.entries(readings)
      .map(([element, raw]) => ({ element: element as ElementSymbol, pct: parseDecimal(raw) }))
      .filter((r) => Number.isFinite(r.pct) && r.pct > 0);

    if (elementReadings.length === 0) {
      setResult(null);
      return;
    }

    const measurement: XRFMeasurement = {
      id: crypto.randomUUID(),
      partMeasured: 'case-back',
      measuredAt: new Date().toISOString(),
      instrument: 'niton-xl',
      readings: elementReadings,
    };

    setResult(bestProfileMatch(measurement, candidateProfiles));
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Verificar reloj', 'Verify watch')}</h1>
        <p className="text-muted text-sm">
          {t(
            'Selecciona un modelo, un año e introduce los porcentajes medidos por el Niton XL. La app encuentra el perfil de referencia más cercano y emite un veredicto.',
            'Select a model, year, and enter the percentages measured by the Niton XL. The app finds the closest reference profile and issues a verdict.',
          )}
        </p>
      </section>

      <section className="space-y-3">
        <div>
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Marca', 'Brand')}</span>
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
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Busca por referencia, modelo o colección', 'Search by reference, model or collection')}</span>
          <input
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            className="field font-mono"
            placeholder={t('p. ej. "126610LN", "Nautilus", "Royal Oak", "Pepsi"...', 'e.g. "126610LN", "Nautilus", "Royal Oak", "Pepsi"...')}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'men', 'women', 'unisex'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`chip cursor-pointer ${audience === a ? '!bg-accent !text-white !border-transparent' : ''}`}
            >
              {a === 'all' ? t('Todos', 'All') : a === 'men' ? t('Hombre', "Men's") : a === 'women' ? t('Mujer', "Women's") : t('Unisex', 'Unisex')}
            </button>
          ))}
          <span className="text-xs text-dim self-center ml-2">{filteredModels.length} {t('de', 'of')} {brandModels.length} {t('modelos', 'models')} · {currentBrand.name}</span>
          {(modelSearch || audience !== 'all') && (
            <button
              onClick={() => { setModelSearch(''); setAudience('all'); }}
              className="text-xs text-accent-bright hover:underline self-center ml-2"
            >
              {t('Limpiar filtros', 'Clear filters')}
            </button>
          )}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Modelo', 'Model')}</span>
          <select value={modelId} onChange={(e) => { setModelId(e.target.value); setModelSearch(''); }} className="field">
            {(filteredModels.length > 0 ? groupedModels : groupedAllModels).map(([collection, models]) => (
              <optgroup key={collection} label={collection}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.reference}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">
            {t('Año de fabricación', 'Year of manufacture')}
            {currentModel && (
              <span className="text-dim/70 normal-case ml-1">· {t('producido', 'produced')} {currentModel.yearStart}–{currentModel.yearEnd ?? t('presente', 'present')}</span>
            )}
          </span>
          <YearPicker years={productionYears} value={year} onChange={setYear} />
        </div>
      </section>

      <MetalModeBanner />

      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-1">{t('Composición XRF medida', 'Measured XRF composition')}</h2>
        <p className="text-xs text-dim mb-4">{t('Introduce el porcentaje de cada elemento que reporta el Niton XL.', 'Enter the percentage for each element reported by the Niton XL.')}</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {ELEMENTS_OF_INTEREST.map((el) => (
            <label key={el} className="block">
              <span className="block text-[0.7rem] text-dim font-mono mb-1">{el}</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={readings[el] ?? ''}
                onChange={(e) => setReadings({ ...readings, [el]: e.target.value })}
                className="field text-sm py-1.5"
              />
            </label>
          ))}
        </div>
        <button onClick={onAnalyze} className="btn-primary mt-5 disabled:opacity-50 disabled:cursor-not-allowed">
          {t('Analizar', 'Analyze')}
        </button>
      </section>

      {result && (
        <section className={`card p-6 space-y-5 fade-in ring-1 ${verdictLabel[result.verdict].ring}`}>
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-dim">{t('Veredicto', 'Verdict')}</div>
              <div className={`text-3xl font-bold ${verdictLabel[result.verdict].color}`}>
                {verdictLabel[result.verdict].text[lang]}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-dim">{t('Puntuación', 'Score')}</div>
              <div className="text-4xl font-mono font-semibold">{result.overallScore}<span className="text-dim text-2xl">/100</span></div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-dim mb-1">{t('Perfil más cercano', 'Closest profile')}</div>
            <div className="font-mono text-sm">{result.materialName}</div>
          </div>

          {result.flags.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Señales', 'Flags')}</div>
              <ul className="space-y-1.5 text-sm text-neutral-200">
                {result.flags.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent-bright">▸</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pro && result.elementMatches.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Detalle por elemento', 'Per-element detail')}</div>
              <table className="w-full text-sm">
                <thead className="text-[0.7rem] text-dim uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2">{t('Elemento', 'Element')}</th>
                    <th className="text-left py-2">{t('Medido', 'Measured')}</th>
                    <th className="text-left py-2">{t('Esperado', 'Expected')}</th>
                    <th className="text-left py-2">{t('Estado', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.elementMatches.map((em) => (
                    <tr key={em.element} className="border-t border-soft">
                      <td className="py-2 font-mono">{em.element}{em.isCritical && <span className="text-accent-bright">*</span>}</td>
                      <td className="py-2">{em.measured.toFixed(2)}%</td>
                      <td className="py-2 text-dim">{em.expectedMin}–{em.expectedMax}%</td>
                      <td className={`py-2 ${
                        em.status === 'in-range' ? 'text-emerald-300' :
                        em.status === 'borderline' ? 'text-amber-300' : 'text-red-300'
                      }`}>
                        {em.status === 'in-range' ? t('en rango', 'in range') :
                         em.status === 'borderline' ? t('al límite', 'borderline') : t('fuera de rango', 'out of range')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-dim mt-2">{t('* elemento crítico', '* critical element')}</div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
