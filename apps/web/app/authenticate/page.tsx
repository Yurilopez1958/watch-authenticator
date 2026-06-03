'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_BRANDS,
  ALL_MODELS,
  bestProfileMatch,
  checkMovementCaliber,
  getMovementForModelAcrossBrands,
  getReferenceProfilesForBrand,
  parseNitonCsv,
  rowToMeasurement,
  type ElementReading,
  type ElementSymbol,
  type MatchResult,
  type MovementCheck,
  type WatchPart,
  type XRFMeasurement,
} from '@watch-auth/core';

const ELEMENTS_OF_INTEREST: ElementSymbol[] = [
  'Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si',
  'Au', 'Ag', 'Pt', 'Pd', 'Ru',
];

const YEAR_OPTIONS = ((): number[] => {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= 1950; y--) years.push(y);
  return years;
})();

const PARTS: readonly { id: WatchPart; label: string }[] = [
  { id: 'movement', label: 'Movement' },
  { id: 'hands', label: 'Hands' },
  { id: 'logo', label: 'Logo / crown' },
  { id: 'dial', label: 'Dial' },
  { id: 'serial-number', label: 'Serial number' },
  { id: 'case-back', label: 'Case back' },
  { id: 'bezel', label: 'Bezel' },
  { id: 'bracelet-link', label: 'Bracelet' },
  { id: 'clasp', label: 'Clasp' },
];

type Step = 0 | 1 | 2 | 3 | 4;
const STEP_LABELS = ['Watch', 'XRF measurement', 'Movement', 'Visual evidence', 'Verdict'] as const;

type XrfMode = 'manual' | 'csv' | 'skip';

type StepStatus = 'pass' | 'fail' | 'warn' | 'pending';

const STATUS_STYLE: Record<StepStatus, { color: string; bg: string; border: string; label: string }> = {
  pass:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.4)',  label: 'Pass' },
  fail:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   label: 'Fail' },
  warn:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)',  label: 'Check' },
  pending: { color: '#64748b', bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.3)', label: 'Pending' },
};

/** Small flag icon coloured by exam status. Pending shows a faint dash. */
function StatusFlag({ status, size = 16 }: { status: StepStatus; size?: number }) {
  const c = STATUS_STYLE[status].color;
  if (status === 'pending') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" aria-label="pending">
        <line x1="6" y1="12" x2="18" y2="12" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={STATUS_STYLE[status].label}>
      <path d="M4 21V4" />
      <path d="M4 4h11l-1.5 3.5L15 11H4" fill={c} fillOpacity="0.85" />
    </svg>
  );
}

/** Pill badge: coloured flag + label, used in step card headers. */
function StatusBadge({ status }: { status: StepStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      <StatusFlag status={status} size={13} />
      {s.label}
    </span>
  );
}

export default function AuthenticatePage() {
  const [step, setStep] = useState<Step>(0);

  // Step 1 — watch identification
  const [brandId, setBrandId] = useState<string>(ALL_BRANDS[0]!.id);
  const [audience, setAudience] = useState<'all' | 'men' | 'women' | 'unisex'>('all');
  const [modelSearch, setModelSearch] = useState('');
  const [modelId, setModelId] = useState<string>(ALL_MODELS[0]!.id);
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [serial, setSerial] = useState('');
  const [notes, setNotes] = useState('');

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

  // Reset selection when brand changes or current selection no longer matches
  useEffect(() => {
    if (!filteredModels.some((m) => m.id === modelId) && filteredModels.length > 0) {
      setModelId(filteredModels[0]!.id);
    }
  }, [filteredModels, modelId]);

  // Step 2 — XRF
  const [xrfMode, setXrfMode] = useState<XrfMode>('manual');
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [csvText, setCsvText] = useState('');

  // Step 3 — Movement
  const [observedCaliber, setObservedCaliber] = useState('');

  // Step 4 — photos
  const [examinedPart, setExaminedPart] = useState<WatchPart>('movement');
  const [examined, setExamined] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const examinedRef = useRef<HTMLInputElement | null>(null);
  const referenceRef = useRef<HTMLInputElement | null>(null);
  const [liveSide, setLiveSide] = useState<'examined' | 'reference' | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 5 — results
  const [xrfResult, setXrfResult] = useState<MatchResult | null>(null);
  const [xrfRowCount, setXrfRowCount] = useState(0);
  const [movementResult, setMovementResult] = useState<MovementCheck | null>(null);

  const brandProfiles = useMemo(() => getReferenceProfilesForBrand(brandId), [brandId]);
  const candidateProfiles = useMemo(
    () =>
      brandProfiles.filter(
        (p) => year >= p.yearStart && (p.yearEnd == null || year <= p.yearEnd),
      ),
    [brandProfiles, year],
  );

  const currentModel = ALL_MODELS.find((m) => m.id === modelId)!;
  const currentBrand = ALL_BRANDS.find((b) => b.id === brandId)!;
  const expectedMovement = useMemo(() => getMovementForModelAcrossBrands(modelId), [modelId]);
  const livePreview = useMemo(
    () => checkMovementCaliber(modelId, observedCaliber),
    [modelId, observedCaliber],
  );

  // ===== Live exam results (recomputed as the user fills each step) =====
  const liveXrf = useMemo<MatchResult | null>(() => {
    if (xrfMode === 'skip') return null;
    if (xrfMode === 'manual') {
      const er: ElementReading[] = Object.entries(readings)
        .map(([element, raw]) => ({ element: element as ElementSymbol, pct: parseFloat(raw) }))
        .filter((r) => Number.isFinite(r.pct) && r.pct > 0);
      if (er.length === 0) return null;
      return bestProfileMatch(
        { id: 'live', partMeasured: 'case-back', measuredAt: '', instrument: 'niton-xl', readings: er },
        candidateProfiles,
      );
    }
    if (!csvText.trim()) return null;
    const parsed = parseNitonCsv(csvText);
    if (parsed.rows.length === 0) return null;
    return bestProfileMatch(rowToMeasurement(parsed.rows[0]!), candidateProfiles);
  }, [xrfMode, readings, csvText, candidateProfiles]);

  // Status flag per step: 'pass' (green) | 'fail' (red) | 'warn' (amber) | 'pending' (grey)
  const stepStatuses = useMemo<StepStatus[]>(() => {
    const s: StepStatus[] = ['pending', 'pending', 'pending', 'pending', 'pending'];

    // Step 1 — watch identification: complete once a model + year are chosen
    s[0] = modelId && year ? 'pass' : 'pending';

    // Step 2 — XRF: verdict-driven
    if (xrfMode !== 'skip' && liveXrf) {
      s[1] = liveXrf.verdict === 'likely-authentic'
        ? 'pass'
        : liveXrf.verdict === 'inconclusive'
          ? 'warn'
          : 'fail';
    }

    // Step 3 — Movement: only meaningful once a caliber is typed
    if (observedCaliber.trim()) {
      s[2] = livePreview.status === 'match'
        ? 'pass'
        : livePreview.status === 'mismatch'
          ? 'fail'
          : 'pending';
    }

    // Step 4 — Visual: no automatic exam yet; mark captured if both photos present
    s[3] = examined && reference ? 'pass' : 'pending';

    // Step 5 — Combined verdict: worst of the evaluated exams
    const evaluated = [s[1], s[2]].filter((x) => x !== 'pending');
    s[4] = evaluated.includes('fail')
      ? 'fail'
      : evaluated.includes('warn')
        ? 'warn'
        : evaluated.length > 0
          ? 'pass'
          : 'pending';

    return s;
  }, [modelId, year, xrfMode, liveXrf, observedCaliber, livePreview, examined, reference]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => () => stopStream(), []);

  const openCamera = async (side: 'examined' | 'reference') => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveSide(side);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 50);
    } catch (err) {
      alert(`Camera not available: ${(err as Error).message}.`);
    }
  };

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || !liveSide) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (liveSide === 'examined') setExamined(dataUrl);
    else setReference(dataUrl);
    stopStream();
    setLiveSide(null);
  };

  const onFile = (side: 'examined' | 'reference') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (side === 'examined') setExamined(data);
      else setReference(data);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = () => {
    // XRF
    if (xrfMode === 'manual') {
      const elementReadings: ElementReading[] = Object.entries(readings)
        .map(([element, raw]) => ({ element: element as ElementSymbol, pct: parseFloat(raw) }))
        .filter((r) => Number.isFinite(r.pct) && r.pct > 0);
      if (elementReadings.length > 0) {
        const measurement: XRFMeasurement = {
          id: crypto.randomUUID(),
          partMeasured: 'case-back',
          measuredAt: new Date().toISOString(),
          instrument: 'niton-xl',
          readings: elementReadings,
        };
        setXrfResult(bestProfileMatch(measurement, candidateProfiles));
        setXrfRowCount(1);
      } else {
        setXrfResult(null);
        setXrfRowCount(0);
      }
    } else if (xrfMode === 'csv') {
      if (!csvText.trim()) { setXrfResult(null); setXrfRowCount(0); }
      else {
        const parsed = parseNitonCsv(csvText);
        setXrfRowCount(parsed.rows.length);
        if (parsed.rows.length > 0) {
          const measurement = rowToMeasurement(parsed.rows[0]!);
          setXrfResult(bestProfileMatch(measurement, candidateProfiles));
        } else setXrfResult(null);
      }
    } else {
      setXrfResult(null);
      setXrfRowCount(0);
    }
    // Movement
    setMovementResult(checkMovementCaliber(modelId, observedCaliber));
  };

  const goNext = () => {
    if (step === 3) runAnalysis();
    setStep(((step + 1) % 5) as Step);
  };
  const goBack = () => setStep((Math.max(0, step - 1)) as Step);

  const canAdvance = (): boolean => {
    if (step === 0) return !!modelId && !!year;
    if (step === 1) {
      if (xrfMode === 'skip') return true;
      if (xrfMode === 'manual') return Object.values(readings).some((v) => parseFloat(v) > 0);
      return csvText.trim().length > 0;
    }
    if (step === 2) return true; // movement step is optional
    if (step === 3) return true;
    return false;
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">Guided authentication</h1>
        <p className="text-muted text-sm">
          A five-step wizard: identify the watch, capture the XRF reading, cross-check the
          movement caliber, gather visual evidence, and read the combined verdict.
        </p>
      </section>

      <StepHeader step={step} statuses={stepStatuses} onJump={(s) => setStep(s)} />

      {step === 0 && (
        <StepCard title="1. Watch identification" subtitle="Tell the app which piece you are inspecting." status={stepStatuses[0]}>
          <div className="mb-4 space-y-3">
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
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">Search by reference number, model or collection</span>
              <input
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="field font-mono"
                placeholder='e.g. "126610LN", "Nautilus", "Royal Oak", "Pepsi"...'
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'men', 'women', 'unisex'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`chip cursor-pointer ${audience === a ? '!bg-accent !text-white !border-transparent' : ''}`}
                >
                  {a === 'all' ? 'All' : a === 'men' ? "Men's" : a === 'women' ? "Women's" : 'Unisex'}
                </button>
              ))}
              <span className="text-xs text-dim self-center ml-2">{filteredModels.length} of {brandModels.length} models · {currentBrand.name}</span>
              {(modelSearch || audience !== 'all') && (
                <button
                  onClick={() => { setModelSearch(''); setAudience('all'); }}
                  className="text-xs text-accent-bright hover:underline self-center ml-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">Model</span>
              <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="field" disabled={filteredModels.length === 0}>
                {filteredModels.length === 0 && <option>No matches</option>}
                {groupedModels.map(([collection, models]) => (
                  <optgroup key={collection} label={collection}>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} — {m.reference}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">Year of manufacture</span>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="field">
                {YEAR_OPTIONS.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">Serial number (optional)</span>
              <input value={serial} onChange={(e) => setSerial(e.target.value)} className="field" placeholder="e.g. M7P8" />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">Notes (optional)</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="field" placeholder="provenance, condition, etc." />
            </label>
          </div>
          <div className="text-xs text-dim mt-4">
            {candidateProfiles.length} reference profile(s) match this year.{' '}
            {candidateProfiles.length === 0 && 'Pick a different year — no Rolex reference covers this period yet.'}
          </div>
        </StepCard>
      )}

      {step === 1 && (
        <StepCard title="2. XRF measurement" subtitle="Pick how you want to feed the composition into the app." status={stepStatuses[1]}>
          <div className="flex flex-wrap gap-2 mb-5">
            {(['manual','csv','skip'] as XrfMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setXrfMode(m)}
                className={`chip cursor-pointer ${xrfMode === m ? '!bg-accent !text-white !border-transparent' : ''}`}
              >
                {m === 'manual' ? 'Manual entry' : m === 'csv' ? 'Niton CSV' : 'Skip XRF'}
              </button>
            ))}
          </div>

          {xrfMode === 'manual' && (
            <div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {ELEMENTS_OF_INTEREST.map((el) => (
                  <label key={el} className="block">
                    <span className="block text-[0.7rem] font-mono text-dim mb-1">{el}</span>
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
              <div className="text-xs text-dim mt-3">Enter at least one element &gt; 0 to advance.</div>
            </div>
          )}

          {xrfMode === 'csv' && (
            <div className="space-y-3">
              <input type="file" accept=".csv,text/csv" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                file.text().then(setCsvText);
              }} className="field text-sm" />
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                placeholder="Reading #,Date,Time,Duration,Mode,Sample ID,Operator,Notes,Au,Au Err,..."
                className="field font-mono text-xs"
              />
              <div className="text-xs text-dim">First row will be used as the main measurement.</div>
            </div>
          )}

          {xrfMode === 'skip' && (
            <div className="text-sm text-muted">
              You can proceed without XRF data. The verdict will rely on the movement check and visual evidence.
            </div>
          )}
        </StepCard>
      )}

      {step === 2 && (
        <StepCard
          title="3. Movement caliber check"
          subtitle="Cross-check the caliber engraved on the movement against what Rolex should have used in this reference."
          status={stepStatuses[2]}
        >
          {expectedMovement ? (
            <>
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div className="rounded-lg border border-soft bg-card p-4 space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-dim">Expected caliber</div>
                    <div className="text-3xl font-bold text-gradient mt-1">Cal. {expectedMovement.caliber}</div>
                    <div className="text-xs text-dim mt-1">For {currentModel.name} ({currentModel.reference})</div>
                  </div>
                  <ul className="text-sm space-y-1.5">
                    <li className="flex justify-between"><span className="text-dim">Jewels</span><span>{expectedMovement.jewels}</span></li>
                    <li className="flex justify-between"><span className="text-dim">Power reserve</span><span>{expectedMovement.powerReserveHours} h</span></li>
                    <li className="flex justify-between"><span className="text-dim">Vibrations / hour</span><span>{expectedMovement.vph.toLocaleString()} ({(expectedMovement.vph / 7200).toFixed(0)} Hz)</span></li>
                    <li className="flex justify-between"><span className="text-dim">Escapement</span><span className="capitalize">{expectedMovement.escapement}</span></li>
                    <li className="flex justify-between"><span className="text-dim">Functions</span><span className="capitalize">{expectedMovement.features.join(', ')}</span></li>
                    <li className="flex justify-between"><span className="text-dim">In production</span><span>{expectedMovement.yearStart}–{expectedMovement.yearEnd ?? 'present'}</span></li>
                    <li className="flex justify-between"><span className="text-dim">COSC</span><span>{expectedMovement.cosc ? 'Yes' : 'No'}</span></li>
                  </ul>
                  {expectedMovement.notes && (
                    <p className="text-xs text-muted leading-relaxed border-t border-soft pt-3">{expectedMovement.notes}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-xs uppercase tracking-wide text-dim mb-2">Caliber engraved on the movement</span>
                    <input
                      value={observedCaliber}
                      onChange={(e) => setObservedCaliber(e.target.value)}
                      className="field text-lg font-mono"
                      placeholder="e.g. 3235"
                    />
                    <span className="block text-xs text-dim mt-1">
                      Open the case-back and read the number on the rotor or the main plate.
                      You can write &quot;Cal. 3235&quot; or just &quot;3235&quot; — both work.
                    </span>
                  </label>

                  {livePreview && (
                    <div
                      className={`rounded-lg border px-4 py-3 text-sm fade-in ${
                        livePreview.status === 'match'
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                          : livePreview.status === 'mismatch'
                            ? 'border-red-500/40 bg-red-500/10 text-red-200'
                            : 'border-soft bg-card text-muted'
                      }`}
                    >
                      {livePreview.status === 'match' && (
                        <>
                          <div className="font-semibold mb-1">✓ Match</div>
                          <div className="text-xs">{livePreview.note}</div>
                        </>
                      )}
                      {livePreview.status === 'mismatch' && (
                        <>
                          <div className="font-semibold mb-1">✗ Mismatch</div>
                          <div className="text-xs">{livePreview.note}</div>
                        </>
                      )}
                      {livePreview.status === 'not-provided' && (
                        <>
                          <div className="font-semibold mb-1">Waiting for input</div>
                          <div className="text-xs">{livePreview.note}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-dim">This step is optional — you can advance without filling in the observed caliber.</div>
            </>
          ) : (
            <div className="text-sm text-muted">
              No reference caliber on file for this model yet. Add it to <code>rolex-movements.ts</code> to enable the check.
            </div>
          )}
        </StepCard>
      )}

      {step === 3 && (
        <StepCard title="4. Visual evidence (optional)" subtitle="Capture the examined watch and an authentic reference for the same part." status={stepStatuses[3]}>
          <div className="text-xs uppercase tracking-wide text-dim mb-2">Watch part</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {PARTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setExaminedPart(p.id)}
                className={`chip cursor-pointer ${examinedPart === p.id ? '!bg-accent !text-white !border-transparent' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <PhotoSlot
              title="Examined watch"
              dataUrl={examined}
              onCamera={() => openCamera('examined')}
              onUpload={() => examinedRef.current?.click()}
              onReset={() => setExamined(null)}
            />
            <PhotoSlot
              title="Authentic reference"
              dataUrl={reference}
              onCamera={() => openCamera('reference')}
              onUpload={() => referenceRef.current?.click()}
              onReset={() => setReference(null)}
            />
            <input ref={examinedRef} type="file" accept="image/*" onChange={onFile('examined')} className="hidden" />
            <input ref={referenceRef} type="file" accept="image/*" onChange={onFile('reference')} className="hidden" />
          </div>
        </StepCard>
      )}

      {step === 4 && (
        <StepCard title="5. Combined verdict" subtitle={`Result for ${currentModel.name} (ref. ${currentModel.reference}), declared year ${year}.`} status={stepStatuses[4]}>
          <div className="space-y-6">
            <SummaryBlock title="Identification">
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div><span className="text-dim">Model:</span> {currentModel.name} ({currentModel.reference})</div>
                <div><span className="text-dim">Year:</span> {year}</div>
                {serial && <div><span className="text-dim">Serial:</span> {serial}</div>}
                {notes && <div><span className="text-dim">Notes:</span> {notes}</div>}
              </div>
            </SummaryBlock>

            <SummaryBlock title="XRF analysis">
              {xrfResult ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <div className={`text-2xl font-bold ${
                      xrfResult.verdict === 'likely-authentic' ? 'text-emerald-300' :
                      xrfResult.verdict === 'inconclusive' ? 'text-amber-300' : 'text-red-300'
                    }`}>
                      {xrfResult.verdict === 'likely-authentic' ? 'Likely authentic' :
                       xrfResult.verdict === 'inconclusive' ? 'Inconclusive' : 'Likely fake'}
                    </div>
                    <div className="font-mono text-2xl">{xrfResult.overallScore}<span className="text-dim text-base">/100</span></div>
                  </div>
                  <div className="text-xs text-dim">Closest profile: <span className="font-mono">{xrfResult.materialName}</span> · {xrfRowCount > 1 ? `${xrfRowCount} readings parsed, first one shown` : 'single reading'}</div>
                  {xrfResult.flags.length > 0 && (
                    <ul className="text-sm text-neutral-200 space-y-1">
                      {xrfResult.flags.map((f, i) => (
                        <li key={i} className="flex gap-2"><span className="text-accent-bright">▸</span><span>{f}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="text-sm text-dim">XRF was skipped or no readings were entered.</div>
              )}
            </SummaryBlock>

            <SummaryBlock title="Movement check">
              {movementResult ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div className={`text-lg font-semibold ${
                      movementResult.status === 'match' ? 'text-emerald-300'
                      : movementResult.status === 'mismatch' ? 'text-red-300'
                      : 'text-amber-300'
                    }`}>
                      {movementResult.status === 'match' ? '✓ Caliber matches'
                      : movementResult.status === 'mismatch' ? '✗ Caliber mismatch'
                      : movementResult.status === 'not-provided' ? 'Not provided'
                      : 'Unknown model'}
                    </div>
                    {movementResult.expectedCaliber && (
                      <div className="text-sm text-muted">expected <span className="font-mono">Cal. {movementResult.expectedCaliber}</span></div>
                    )}
                    {movementResult.observedCaliber && (
                      <div className="text-sm text-muted">observed <span className="font-mono">{movementResult.observedCaliber}</span></div>
                    )}
                  </div>
                  {movementResult.note && <div className="text-xs text-muted">{movementResult.note}</div>}
                </div>
              ) : (
                <div className="text-sm text-dim">Movement check was skipped.</div>
              )}
            </SummaryBlock>

            <SummaryBlock title="Visual evidence">
              {examined || reference ? (
                <div className="grid md:grid-cols-2 gap-3">
                  <PhotoView title="Examined" dataUrl={examined} />
                  <PhotoView title="Reference" dataUrl={reference} />
                </div>
              ) : (
                <div className="text-sm text-dim">No photos captured.</div>
              )}
              <div className="text-xs text-dim mt-3">
                AI visual analysis (Claude Vision) requires <code>ANTHROPIC_API_KEY</code> on the server. Once configured, this section will show natural-language findings about the photos.
              </div>
            </SummaryBlock>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(0);
                  setReadings({}); setCsvText(''); setExamined(null); setReference(null);
                  setSerial(''); setNotes(''); setObservedCaliber('');
                  setXrfResult(null); setXrfRowCount(0); setMovementResult(null);
                }}
                className="btn-ghost text-sm"
              >
                Start a new authentication
              </button>
            </div>
          </div>
        </StepCard>
      )}

      <div className="flex justify-between gap-3">
        <button onClick={goBack} disabled={step === 0} className="btn-ghost text-sm disabled:opacity-30 disabled:cursor-not-allowed">
          ← Back
        </button>
        {step < 4 && (
          <button onClick={goNext} disabled={!canAdvance()} className="btn-primary text-sm">
            {step === 3 ? 'Run analysis →' : 'Continue →'}
          </button>
        )}
      </div>

      {liveSide && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 fade-in">
          <div className="w-full max-w-3xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted">
                Capturing for <span className="text-accent-bright font-semibold">{liveSide === 'examined' ? 'examined' : 'reference'}</span> · {PARTS.find((p) => p.id === examinedPart)?.label}
              </div>
              <button onClick={() => { stopStream(); setLiveSide(null); }} className="btn-ghost text-sm">Cancel</button>
            </div>
            <video ref={videoRef} playsInline muted className="w-full rounded-xl border border-soft bg-black aspect-video object-contain" />
            <div className="flex justify-center">
              <button onClick={snapPhoto} className="btn-primary px-8 py-3">Take photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepHeader({ step, statuses, onJump }: { step: Step; statuses: StepStatus[]; onJump: (s: Step) => void }) {
  return (
    <div className="card p-4">
      {/* Mobile: compact numbered circles with a status flag badge in the corner */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-1">
          {STEP_LABELS.map((label, i) => {
            const active = i === step;
            const st = statuses[i] ?? 'pending';
            return (
              <button
                key={label}
                onClick={() => onJump(i as Step)}
                aria-label={`${label} — ${STATUS_STYLE[st].label}`}
                className="flex items-center flex-1 last:flex-none"
              >
                <span className="relative shrink-0">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                      active ? 'bg-accent-soft text-accent-bright border-accent' : 'bg-card text-dim border-soft'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {st !== 'pending' && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: STATUS_STYLE[st].bg, border: `1px solid ${STATUS_STYLE[st].border}` }}
                    >
                      <StatusFlag status={st} size={10} />
                    </span>
                  )}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <span className={`h-px flex-1 mx-1 ${i < step ? 'bg-accent' : 'bg-soft'}`} />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 text-center flex items-center justify-center gap-2">
          <div>
            <span className="text-xs text-dim">Step {step + 1} of {STEP_LABELS.length}</span>
            <div className="text-accent-bright font-semibold">{STEP_LABELS[step]}</div>
          </div>
        </div>
      </div>

      {/* Desktop: full labels inline with a flag before each one */}
      <div className="hidden md:flex items-center justify-between gap-2 flex-wrap">
        {STEP_LABELS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          const st = statuses[i] ?? 'pending';
          return (
            <button
              key={label}
              onClick={() => onJump(i as Step)}
              className="flex items-center gap-2 text-sm group"
            >
              <span className="relative">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                    active ? 'bg-accent-soft text-accent-bright border-accent'
                      : done ? 'bg-accent/30 text-foreground border-transparent'
                        : 'bg-card text-dim border-soft'
                  }`}
                >
                  {i + 1}
                </span>
                {st !== 'pending' && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: STATUS_STYLE[st].bg, border: `1px solid ${STATUS_STYLE[st].border}` }}
                  >
                    <StatusFlag status={st} size={10} />
                  </span>
                )}
              </span>
              <span className={active ? 'text-accent-bright font-semibold' : done ? 'text-foreground' : 'text-dim'}>
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <span className={`w-8 h-px ${i < step ? 'bg-accent' : 'bg-soft'} mx-1 hidden md:block`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepCard({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  status?: StepStatus | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 space-y-5 fade-in">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted mt-1">{subtitle}</p>
        </div>
        {status && <div className="shrink-0 pt-0.5"><StatusBadge status={status} /></div>}
      </header>
      {children}
    </section>
  );
}

function SummaryBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-dim mb-2">{title}</div>
      <div className="rounded-lg border border-soft bg-card p-4">{children}</div>
    </div>
  );
}

function PhotoSlot({
  title,
  dataUrl,
  onCamera,
  onUpload,
  onReset,
}: {
  title: string;
  dataUrl: string | null;
  onCamera: () => void;
  onUpload: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-dim">{title}</div>
      <div className="aspect-square rounded-xl bg-black/40 border border-soft border-dashed flex items-center justify-center overflow-hidden">
        {dataUrl ? (
          <img src={dataUrl} alt={title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-dim text-xs">no photo yet</div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onCamera} className="btn-primary text-xs flex-1 min-w-[7rem]">{dataUrl ? 'Retake' : 'Open camera'}</button>
        <button onClick={onUpload} className="btn-ghost text-xs flex-1 min-w-[5rem]">Upload</button>
        {dataUrl && <button onClick={onReset} className="btn-ghost text-xs">Reset</button>}
      </div>
    </div>
  );
}

function PhotoView({ title, dataUrl }: { title: string; dataUrl: string | null }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-dim mb-1">{title}</div>
      <div className="aspect-square rounded-lg bg-black/40 border border-soft flex items-center justify-center overflow-hidden">
        {dataUrl
          ? <img src={dataUrl} alt={title} className="w-full h-full object-contain" />
          : <div className="text-dim text-xs">not provided</div>}
      </div>
    </div>
  );
}
