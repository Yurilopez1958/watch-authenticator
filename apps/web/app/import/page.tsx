'use client';

import { useMemo, useState } from 'react';
import {
  ROLEX_REFERENCE_PROFILES,
  bestProfileMatch,
  parseNitonCsv,
  rowToMeasurement,
  type MatchResult,
  type NitonImportResult,
  type NitonImportRow,
} from '@watch-auth/core';

type AnalyzedRow = {
  row: NitonImportRow;
  result: MatchResult | null;
};

const YEAR_OPTIONS = ((): number[] => {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 1950; y--) years.push(y);
  return years;
})();

export default function ImportPage() {
  const [csvText, setCsvText] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [parsed, setParsed] = useState<NitonImportResult | null>(null);

  // Verdicts are DERIVED from the parsed rows + the selected year, so changing
  // the year after parsing re-evaluates every row against the right profiles.
  const analyzed = useMemo<AnalyzedRow[]>(() => {
    if (!parsed) return [];
    const profiles = ROLEX_REFERENCE_PROFILES.filter(
      (p) => year >= p.yearStart && (p.yearEnd == null || year <= p.yearEnd),
    );
    return parsed.rows.map((row) => ({
      row,
      result: bestProfileMatch(rowToMeasurement(row), profiles),
    }));
  }, [parsed, year]);

  const onFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
  };

  const onParse = () => {
    if (!csvText.trim()) return;
    setParsed(parseNitonCsv(csvText));
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">Import Niton XL measurements</h1>
        <p className="text-muted text-sm">
          Upload the CSV exported by NDT or NitonConnect (with "Also Save CSV" enabled).
          The app parses each reading, compares it against the Rolex reference profiles for
          the year you set, and shows a per-row verdict.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">Year of the measured watches</span>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="field">
            {YEAR_OPTIONS.map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
            className="field text-sm"
          />
        </label>
      </section>

      <section className="card p-5">
        <span className="block text-xs uppercase tracking-wide text-dim mb-2">Or paste the CSV contents here</span>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={6}
          placeholder="Reading #,Date,Time,Duration,Mode,Sample ID,Operator,Notes,Au,Au Err,Ag,Ag Err,..."
          className="field font-mono text-xs"
        />
        <button onClick={onParse} className="btn-primary mt-3">
          Parse and analyze
        </button>
      </section>

      {parsed && (
        <section className="card p-5 space-y-3 fade-in">
          <div className="flex justify-between items-baseline">
            <h2 className="text-lg font-semibold">Summary</h2>
            <span className="chip">{parsed.rows.length} parsed</span>
          </div>
          {parsed.warnings.length > 0 && (
            <div className="text-sm text-amber-300 space-y-1">
              {parsed.warnings.map((w, i) => (<div key={i}>⚠ {w}</div>))}
            </div>
          )}
          {parsed.unrecognizedColumns.length > 0 && (
            <div className="text-xs text-dim">
              Unrecognized columns (ignored): {parsed.unrecognizedColumns.join(', ')}
            </div>
          )}
        </section>
      )}

      {analyzed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Measurements</h2>
          <div className="space-y-3">
            {analyzed.map((a, i) => (
              <div key={i} className="card p-4 card-hover fade-in">
                <div className="flex justify-between items-baseline mb-2 flex-wrap gap-2">
                  <div className="text-sm">
                    <span className="font-mono text-dim">#{a.row.readingNumber ?? '?'}</span>
                    {' · '}
                    <span className="font-medium">{a.row.sampleId ?? 'no ID'}</span>
                    {a.row.mode && <span className="text-dim"> · {a.row.mode}</span>}
                  </div>
                  {a.result && (
                    <div className={`text-sm font-semibold flex items-center gap-2 ${
                      a.result.verdict === 'likely-authentic' ? 'text-emerald-300' :
                      a.result.verdict === 'inconclusive' ? 'text-amber-300' : 'text-red-300'
                    }`}>
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        a.result.verdict === 'likely-authentic' ? 'bg-emerald-400' :
                        a.result.verdict === 'inconclusive' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      {a.result.verdict === 'likely-authentic' ? 'Authentic' :
                       a.result.verdict === 'inconclusive' ? 'Inconclusive' : 'Suspicious'}
                      <span className="font-mono text-muted">{a.result.overallScore}/100</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted">
                  {a.row.readings.map((r) => `${r.element} ${r.pct.toFixed(2)}%`).join(' · ')}
                </div>
                {a.result && a.result.flags.length > 0 && (
                  <ul className="mt-3 text-xs text-neutral-200 space-y-1">
                    {a.result.flags.slice(0, 3).map((f, j) => (
                      <li key={j} className="flex gap-2"><span className="text-accent-bright">▸</span><span>{f}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
