'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_BRANDS,
  ALL_MODELS,
  bestProfileMatch,
  checkMovementCaliber,
  getBrandCheckpoints,
  getMovementCheckpoints,
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
import { getPhotos, type RefPhoto } from '@/lib/photo-store';

type VisionFinding = { severity: 'low' | 'medium' | 'high'; area: string; description: string };
type VisionResult = {
  verdict: 'consistent' | 'suspicious' | 'inconclusive';
  confidence: number;
  summary: string;
  findings: VisionFinding[];
};

function dataUrlParts(dataUrl: string): { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' } {
  const comma = dataUrl.indexOf(',');
  const mt = (dataUrl.slice(5, comma).split(';')[0] || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp';
  return { base64: dataUrl.slice(comma + 1), mediaType: mt };
}

/** POSTs JSON and retries once on a 5xx or network error, which smooths over the
 *  cold start of a serverless function (the first request after a deploy can
 *  transiently 500 before the function is warm). */
async function postJsonWithRetry(url: string, payload: unknown): Promise<Response> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
  try {
    const res = await fetch(url, init);
    if (res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1500));
      return await fetch(url, init);
    }
    return res;
  } catch {
    await new Promise((r) => setTimeout(r, 1500));
    return await fetch(url, init);
  }
}

const ELEMENTS_OF_INTEREST: ElementSymbol[] = [
  'Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si',
  'Au', 'Ag', 'Pt', 'Pd', 'Ru',
];

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

type XrfMode = 'manual' | 'connected' | 'photo' | 'skip';

/** Independently-measured metal targets on the watch. Each keeps its own reading. */
type XrfTarget = 'case' | 'bracelet' | 'case-back';
const XRF_TARGETS: readonly { id: XrfTarget; label: string; hint: string }[] = [
  { id: 'case', label: 'Case', hint: 'main case body / lugs' },
  { id: 'bracelet', label: 'Bracelet', hint: 'a metal bracelet link or the clasp' },
  { id: 'case-back', label: 'Case back', hint: 'the screw-down back' },
];

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

/** Year selector restricted to a model's production range. Chips for short
 *  ranges, dropdown for long ones. */
function YearPicker({ years, value, onChange }: { years: number[]; value: number; onChange: (y: number) => void }) {
  if (years.length === 0) {
    return <div className="text-sm text-dim">No production years on file.</div>;
  }
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

/** Large selectable card-button for picking an XRF input method. */
function XrfModeButton({
  mode,
  current,
  onClick,
  label,
  desc,
  icon,
}: {
  mode: XrfMode;
  current: XrfMode;
  onClick: (m: XrfMode) => void;
  label: string;
  desc: string;
  icon: React.ReactNode;
}) {
  const active = current === mode;
  return (
    <button
      onClick={() => onClick(mode)}
      className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-colors ${
        active ? 'border-accent bg-accent-soft' : 'border-soft bg-card hover:border-neutral-600'
      }`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'text-accent-bright' : 'text-muted'}`}
        style={{ backgroundColor: active ? 'rgba(59,130,246,0.12)' : 'rgba(100,116,139,0.1)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </span>
      <span className={`text-sm font-semibold ${active ? 'text-accent-bright' : 'text-foreground'}`}>{label}</span>
      <span className="text-[0.7rem] text-dim leading-tight">{desc}</span>
    </button>
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

  // Step 2 — XRF (measured independently per target: case / bracelet / case back)
  const [xrfMode, setXrfMode] = useState<XrfMode>('manual');
  const [activeTarget, setActiveTarget] = useState<XrfTarget>('case');
  const [readingsByTarget, setReadingsByTarget] = useState<Record<XrfTarget, Record<string, string>>>({
    case: {}, bracelet: {}, 'case-back': {},
  });
  const [csvByTarget, setCsvByTarget] = useState<Record<XrfTarget, string>>({
    case: '', bracelet: '', 'case-back': '',
  });
  // Active-target accessors so the existing input UI keeps working unchanged.
  const readings = readingsByTarget[activeTarget];
  const setReadings = (val: Record<string, string>) =>
    setReadingsByTarget((prev) => ({ ...prev, [activeTarget]: val }));
  const csvText = csvByTarget[activeTarget];
  const setCsvText = (val: string) =>
    setCsvByTarget((prev) => ({ ...prev, [activeTarget]: val }));
  // Photo-of-screen OCR
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoNotes, setPhotoNotes] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const screenPhotoRef = useRef<HTMLInputElement | null>(null);   // camera (capture)
  const screenUploadRef = useRef<HTMLInputElement | null>(null);  // gallery / files

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
  // Reference photos from the user's gallery for the current model + part
  const [galleryPhotos, setGalleryPhotos] = useState<RefPhoto[]>([]);
  // AI visual analysis
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<VisionResult | null>(null);

  // Step 5 — results (XRF result kept per measured target)
  const [xrfResultByTarget, setXrfResultByTarget] = useState<Record<XrfTarget, MatchResult | null>>({
    case: null, bracelet: null, 'case-back': null,
  });
  const [movementResult, setMovementResult] = useState<MovementCheck | null>(null);

  // Warning modal when the measured metal clearly does not match the brand
  const [showMetalWarning, setShowMetalWarning] = useState(false);

  // When the watch identity changes (brand or model), clear every downstream
  // exam input/result so a verdict is never computed from one watch's readings
  // against another watch's reference profiles. Year changes are intentionally
  // NOT reset (same piece, just refining the date).
  const identityKey = `${brandId}/${modelId}`;
  const prevIdentity = useRef(identityKey);
  useEffect(() => {
    if (prevIdentity.current === identityKey) return;
    prevIdentity.current = identityKey;
    setReadingsByTarget({ case: {}, bracelet: {}, 'case-back': {} });
    setCsvByTarget({ case: '', bracelet: '', 'case-back': '' });
    setObservedCaliber('');
    setExamined(null);
    setReference(null);
    setXrfResultByTarget({ case: null, bracelet: null, 'case-back': null });
    setMovementResult(null);
    setPhotoPreview(null);
    setPhotoNotes(null);
    setPhotoError(null);
  }, [identityKey]);

  const candidateProfiles = useMemo(
    () => getReferenceProfilesForBrand(brandId, year),
    [brandId, year],
  );

  const currentModel = ALL_MODELS.find((m) => m.id === modelId)!;
  const currentBrand = ALL_BRANDS.find((b) => b.id === brandId)!;
  const expectedMovement = useMemo(() => getMovementForModelAcrossBrands(modelId), [modelId]);

  // Years this specific model was produced (newest first)
  const productionYears = useMemo(() => {
    const current = new Date().getFullYear();
    const end = Math.min(currentModel.yearEnd ?? current, current);
    const years: number[] = [];
    for (let y = end; y >= currentModel.yearStart; y--) years.push(y);
    return years;
  }, [currentModel]);

  // Keep the selected year within the model's production range
  useEffect(() => {
    if (productionYears.length > 0 && !productionYears.includes(year)) {
      setYear(productionYears[0]!);
    }
  }, [productionYears, year]);
  const livePreview = useMemo(
    () => checkMovementCaliber(modelId, observedCaliber),
    [modelId, observedCaliber],
  );

  // ===== Live exam results (recomputed as the user fills each step) =====
  // Computes a match result for one target's readings (manual/photo) or CSV (connected).
  const computeXrf = (tgtReadings: Record<string, string>, tgtCsv: string): MatchResult | null => {
    if (xrfMode === 'skip') return null;
    if (xrfMode === 'manual' || xrfMode === 'photo') {
      const er: ElementReading[] = Object.entries(tgtReadings)
        .map(([element, raw]) => ({ element: element as ElementSymbol, pct: parseFloat(raw) }))
        .filter((r) => Number.isFinite(r.pct) && r.pct > 0);
      if (er.length === 0) return null;
      return bestProfileMatch(
        { id: 'live', partMeasured: 'case-back', measuredAt: '', instrument: 'niton-xl', readings: er },
        candidateProfiles,
      );
    }
    if (!tgtCsv.trim()) return null;
    const parsed = parseNitonCsv(tgtCsv);
    if (parsed.rows.length === 0) return null;
    return bestProfileMatch(rowToMeasurement(parsed.rows[0]!), candidateProfiles);
  };

  const liveXrfByTarget = useMemo<Record<XrfTarget, MatchResult | null>>(() => ({
    case: computeXrf(readingsByTarget.case, csvByTarget.case),
    bracelet: computeXrf(readingsByTarget.bracelet, csvByTarget.bracelet),
    'case-back': computeXrf(readingsByTarget['case-back'], csvByTarget['case-back']),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [xrfMode, readingsByTarget, csvByTarget, candidateProfiles]);
  const liveXrf = liveXrfByTarget[activeTarget];

  // Status flag per step: 'pass' (green) | 'fail' (red) | 'warn' (amber) | 'pending' (grey)
  const stepStatuses = useMemo<StepStatus[]>(() => {
    const s: StepStatus[] = ['pending', 'pending', 'pending', 'pending', 'pending'];

    // Step 1 — watch identification: complete once a model + year are chosen
    s[0] = modelId && year ? 'pass' : 'pending';

    // Step 2 — XRF: verdict-driven, worst across all measured targets
    if (xrfMode !== 'skip') {
      const measured = Object.values(liveXrfByTarget).filter(Boolean) as MatchResult[];
      if (measured.length > 0) {
        s[1] = measured.some((r) => r.verdict === 'likely-fake')
          ? 'fail'
          : measured.some((r) => r.verdict === 'inconclusive')
            ? 'warn'
            : 'pass';
      }
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
  }, [modelId, year, xrfMode, liveXrfByTarget, observedCaliber, livePreview, examined, reference]);

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
    e.target.value = ''; // allow re-selecting the same file after a reset
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      if (side === 'examined') setExamined(data);
      else setReference(data);
    };
    reader.readAsDataURL(file);
  };

  // Load reference photos from the gallery for the current model + part
  useEffect(() => {
    let alive = true;
    getPhotos(brandId, modelId, examinedPart)
      .then((rows) => { if (alive) setGalleryPhotos(rows); })
      .catch(() => { if (alive) setGalleryPhotos([]); });
    setAiResult(null);
    setAiError(null);
    return () => { alive = false; };
  }, [brandId, modelId, examinedPart]);

  // Run Claude Vision: compare the examined photo against gallery references
  const runAiAnalysis = async () => {
    if (!examined) { setAiError('Capture or upload a photo of the examined watch first.'); return; }
    setAiBusy(true);
    setAiError(null);
    setAiResult(null);
    try {
      const ex = dataUrlParts(examined);
      // Use gallery photos as references; fall back to the manually-added reference
      const refs = galleryPhotos.length > 0
        ? galleryPhotos.slice(0, 4).map((p) => {
            const r = dataUrlParts(p.dataUrl);
            return { part: examinedPart, imageData: r.base64, mediaType: r.mediaType };
          })
        : reference
          ? [{ part: examinedPart, ...((d) => ({ imageData: d.base64, mediaType: d.mediaType }))(dataUrlParts(reference)) }]
          : [];

      const res = await postJsonWithRetry('/api/analyze-part', {
        brandName: currentBrand.name,
        modelName: currentModel.name,
        modelReference: currentModel.reference,
        yearOfManufacture: year,
        part: examinedPart,
        examined: { imageData: ex.base64, mediaType: ex.mediaType },
        references: refs,
      });
      const json = await res.json();
      if (!res.ok) { setAiError(json.error ?? 'AI analysis failed.'); return; }
      setAiResult(json as VisionResult);
    } catch (err) {
      setAiError((err as Error).message);
    } finally {
      setAiBusy(false);
    }
  };

  // Read a photo of the Niton screen with AI and fill in the readings
  const handleScreenPhoto = async (file: File) => {
    setPhotoBusy(true);
    setPhotoError(null);
    setPhotoNotes(null);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read the file.'));
        reader.readAsDataURL(file);
      });
      setPhotoPreview(dataUrl);
      const commaIdx = dataUrl.indexOf(',');
      const base64 = dataUrl.slice(commaIdx + 1);
      const mediaType = (dataUrl.slice(5, commaIdx).split(';')[0] || 'image/jpeg') as
        'image/jpeg' | 'image/png' | 'image/webp';

      const res = await postJsonWithRetry('/api/extract-xrf', { imageBase64: base64, mediaType });
      const json = await res.json();
      if (!res.ok) {
        setPhotoError(json.error ?? 'Could not read the screen.');
        return;
      }
      const next: Record<string, string> = {};
      for (const r of json.readings as { element: string; pct: number }[]) {
        next[r.element] = String(r.pct);
      }
      if (Object.keys(next).length === 0) {
        setPhotoError('No elements could be read from this photo. Try a sharper, straight-on shot of the screen.');
        return;
      }
      setReadings(next);
      setPhotoNotes(json.notes || 'Values extracted. Review and edit any that look wrong before continuing.');
    } catch (err) {
      setPhotoError((err as Error).message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const runAnalysis = () => {
    // Snapshot the live per-target XRF results as the final verdict.
    setXrfResultByTarget({
      case: liveXrfByTarget.case,
      bracelet: liveXrfByTarget.bracelet,
      'case-back': liveXrfByTarget['case-back'],
    });
    // Movement
    setMovementResult(checkMovementCaliber(modelId, observedCaliber));
  };

  const advance = () => {
    if (step === 3) runAnalysis();
    setStep(((step + 1) % 5) as Step);
  };

  const goNext = () => {
    // Leaving the XRF step: if the metal composition clearly does not match the
    // brand, ask the user whether they really want to keep authenticating.
    if (step === 1 && xrfMode !== 'skip' && Object.values(liveXrfByTarget).some((r) => r?.verdict === 'likely-fake')) {
      setShowMetalWarning(true);
      return;
    }
    advance();
  };
  const goBack = () => setStep((Math.max(0, step - 1)) as Step);

  const canAdvance = (): boolean => {
    if (step === 0) return !!modelId && !!year;
    if (step === 1) {
      if (xrfMode === 'skip') return true;
      if (xrfMode === 'manual' || xrfMode === 'photo')
        return XRF_TARGETS.some((t) => Object.values(readingsByTarget[t.id]).some((v) => parseFloat(v) > 0));
      return XRF_TARGETS.some((t) => csvByTarget[t.id].trim().length > 0); // connected
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
            <div className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">
                Year of manufacture
                <span className="text-dim/70 normal-case ml-1">· produced {currentModel.yearStart}–{currentModel.yearEnd ?? 'present'}</span>
              </span>
              <YearPicker years={productionYears} value={year} onChange={setYear} />
            </div>
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
            {candidateProfiles.length === 0 && `Pick a different year — no ${currentBrand.name} reference covers this period yet.`}
          </div>
        </StepCard>
      )}

      {step === 1 && (
        <StepCard title="2. XRF measurement" subtitle="Choose how you want to feed the Niton XL composition into the app." status={stepStatuses[1]}>
          {/* Three input methods + skip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            <XrfModeButton mode="manual" current={xrfMode} onClick={setXrfMode} label="Type it in" desc="Enter the % by hand" icon={
              <path d="M4 7h16M4 12h16M4 17h10" />
            } />
            <XrfModeButton mode="connected" current={xrfMode} onClick={setXrfMode} label="Connected" desc="From the machine" icon={
              <><path d="M5 12h14" /><path d="M12 5v14" /><circle cx="12" cy="12" r="9" /></>
            } />
            <XrfModeButton mode="photo" current={xrfMode} onClick={setXrfMode} label="Photo of screen" desc="AI reads it" icon={
              <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>
            } />
            <XrfModeButton mode="skip" current={xrfMode} onClick={setXrfMode} label="Skip XRF" desc="No metal reading" icon={
              <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>
            } />
          </div>

          {/* Target selector: measure case / bracelet / case back independently */}
          {xrfMode !== 'skip' && (
            <div className="mb-5 rounded-lg border border-soft bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-dim mb-2">Measure each part separately</div>
              <div className="flex flex-wrap gap-2">
                {XRF_TARGETS.map((t) => {
                  const tr = liveXrfByTarget[t.id];
                  const st: StepStatus = !tr
                    ? 'pending'
                    : tr.verdict === 'likely-authentic'
                      ? 'pass'
                      : tr.verdict === 'inconclusive'
                        ? 'warn'
                        : 'fail';
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTarget(t.id);
                        setPhotoPreview(null);
                        setPhotoNotes(null);
                        setPhotoError(null);
                      }}
                      className={`chip cursor-pointer inline-flex items-center gap-1.5 ${
                        activeTarget === t.id ? '!bg-accent !text-white !border-transparent' : ''
                      }`}
                    >
                      <StatusFlag status={st} size={12} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-dim mt-2">
                Now measuring:{' '}
                <span className="text-foreground font-semibold">
                  {XRF_TARGETS.find((t) => t.id === activeTarget)?.label}
                </span>{' '}
                ({XRF_TARGETS.find((t) => t.id === activeTarget)?.hint}). Each part keeps its own reading —
                scan a part, switch tab, scan the next.
              </div>
            </div>
          )}

          {/* Manual + photo both edit the same readings grid */}
          {(xrfMode === 'manual' || xrfMode === 'photo') && (
            <div className="space-y-4">
              {xrfMode === 'photo' && (
                <div className="rounded-lg border border-soft bg-card p-4 space-y-3">
                  <div className="text-sm font-semibold">Photograph the Niton screen</div>
                  <p className="text-xs text-muted">
                    Take a clear, straight-on photo of the analyzer screen showing the element percentages.
                    The AI transcribes them into the fields below for you to review.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => screenPhotoRef.current?.click()}
                      disabled={photoBusy}
                      className="btn-primary text-sm inline-flex items-center gap-2"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      {photoBusy ? 'Reading…' : 'Take photo'}
                    </button>
                    <button
                      onClick={() => screenUploadRef.current?.click()}
                      disabled={photoBusy}
                      className="btn-ghost text-sm inline-flex items-center gap-2"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload from files
                    </button>
                    {photoPreview && !photoBusy && (
                      <span className="text-xs text-emerald-300">✓ Values filled below — review them</span>
                    )}
                  </div>
                  {/* Camera input (forces rear camera on phones) */}
                  <input
                    ref={screenPhotoRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = ''; // allow re-picking the same screenshot
                      if (f) void handleScreenPhoto(f);
                    }}
                  />
                  {/* Gallery / file picker (no capture → lets you pick any saved image) */}
                  <input
                    ref={screenUploadRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = ''; // allow re-picking the same screenshot
                      if (f) void handleScreenPhoto(f);
                    }}
                  />
                  {photoPreview && (
                    <img src={photoPreview} alt="Niton screen" className="rounded-lg border border-soft max-h-40 object-contain" />
                  )}
                  {photoNotes && <div className="text-xs text-emerald-200/80 border-t border-soft pt-2">{photoNotes}</div>}
                  {photoError && (
                    <div className="text-xs text-red-300 border-t border-red-500/30 pt-2">{photoError}</div>
                  )}
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wide text-dim mb-2">
                  {xrfMode === 'photo' ? 'Extracted composition — edit if needed (%)' : 'Composition (%)'}
                </div>
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
            </div>
          )}

          {xrfMode === 'connected' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-soft bg-card p-4 space-y-2 text-sm">
                <div className="font-semibold">Direct from the machine</div>
                <p className="text-xs text-muted leading-relaxed">
                  The Niton XL exports each reading as a CSV (enable &quot;Also Save CSV&quot; in NDT / NitonConnect).
                  Upload that file or paste its contents below. For automatic capture over Bluetooth or a
                  watched folder, set it up on the <Link href="/connect" className="text-accent-bright hover:underline">Connect Niton</Link> page.
                </p>
              </div>
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

          {/* Gallery reference photos for this model + part */}
          {galleryPhotos.length > 0 && (
            <div className="mt-5">
              <div className="text-xs uppercase tracking-wide text-dim mb-2">
                Your reference photos · {currentModel.name} · {PARTS.find((p) => p.id === examinedPart)?.label}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {galleryPhotos.slice(0, 6).map((p) => (
                  <img key={p.id} src={p.dataUrl} alt="reference" className="w-full aspect-square object-cover rounded-lg border border-soft" />
                ))}
              </div>
            </div>
          )}

          {/* AI visual analysis */}
          <div className="mt-6 rounded-lg border border-soft bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-bright">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /><circle cx="12" cy="12" r="3" />
                </svg>
                <h3 className="font-semibold">AI visual analysis</h3>
              </div>
              <button onClick={() => void runAiAnalysis()} disabled={aiBusy || !examined} className="btn-primary text-sm">
                {aiBusy ? 'Analyzing…' : 'Analyze with AI'}
              </button>
            </div>
            <p className="text-xs text-muted">
              Claude Vision compares the examined {PARTS.find((p) => p.id === examinedPart)?.label.toLowerCase()} photo against your
              {galleryPhotos.length > 0 ? ` ${Math.min(galleryPhotos.length, 4)} gallery reference(s)` : ' reference photo'} and flags visual inconsistencies.
              {galleryPhotos.length === 0 && !reference && ' Add reference photos in the Reference gallery, or capture one above, for a stronger comparison.'}
            </p>

            {aiError && <div className="text-xs text-red-300 border-t border-red-500/30 pt-2">{aiError}</div>}

            {aiResult && (
              <div className="fade-in space-y-2 border-t border-soft pt-3">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <span className={`text-lg font-bold ${
                    aiResult.verdict === 'consistent' ? 'text-emerald-300' :
                    aiResult.verdict === 'suspicious' ? 'text-red-300' : 'text-amber-300'
                  }`}>
                    {aiResult.verdict === 'consistent' ? 'Consistent with authentic' :
                     aiResult.verdict === 'suspicious' ? 'Suspicious — review' : 'Inconclusive'}
                  </span>
                  <span className="text-xs text-dim">confidence {Math.round((aiResult.confidence ?? 0) * 100)}%</span>
                </div>
                {aiResult.summary && <p className="text-sm text-neutral-200">{aiResult.summary}</p>}
                {aiResult.findings?.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {aiResult.findings.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className={`shrink-0 ${f.severity === 'high' ? 'text-red-400' : f.severity === 'medium' ? 'text-amber-400' : 'text-dim'}`}>▸</span>
                        <span><span className="text-muted">{f.area}:</span> {f.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[0.7rem] text-dim pt-1">AI guidance only — final authentication requires physical inspection in hand.</p>
              </div>
            )}
          </div>

          {/* Authentication guide (per brand) */}
          {getBrandCheckpoints(brandId).length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-bright">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <h3 className="font-semibold">Authentication checklist — what to compare</h3>
              </div>
              <p className="text-xs text-muted">
                Textual reference guide for {currentBrand.name}. Compare each point against your own
                verified authentic piece — this guide tells you what to look for.
              </p>

              {/* Movement-specific points when the movement part is selected */}
              {examinedPart === 'movement' && expectedMovement && getMovementCheckpoints(expectedMovement.caliber).length > 0 && (
                <div className="rounded-lg border border-accent/40 bg-accent-soft p-4">
                  <div className="text-sm font-semibold text-accent-bright mb-2">
                    Movement · Cal. {expectedMovement.caliber}
                  </div>
                  <ul className="space-y-1.5 text-sm text-neutral-200">
                    {getMovementCheckpoints(expectedMovement.caliber).map((pt, i) => (
                      <li key={i} className="flex gap-2"><span className="text-accent-bright shrink-0">▸</span><span>{pt}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* General brand checkpoints */}
              <div className="grid md:grid-cols-2 gap-3">
                {getBrandCheckpoints(brandId).map((cp) => (
                  <div key={cp.id} className="rounded-lg border border-soft bg-card p-4">
                    <div className="text-sm font-semibold mb-2">{cp.label}</div>
                    <ul className="space-y-1.5 text-xs text-muted">
                      {cp.points.map((pt, i) => (
                        <li key={i} className="flex gap-2"><span className="text-accent-bright shrink-0">·</span><span>{pt}</span></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
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

            <SummaryBlock title="XRF analysis — per part">
              {Object.values(xrfResultByTarget).some(Boolean) ? (
                <div className="space-y-4">
                  {XRF_TARGETS.map((t) => {
                    const r = xrfResultByTarget[t.id];
                    return (
                      <div key={t.id} className="border-t border-soft pt-3 first:border-t-0 first:pt-0">
                        {r ? (
                          <>
                            <div className="flex justify-between items-baseline flex-wrap gap-2">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-xs uppercase tracking-wide text-dim">{t.label}</span>
                                <span className={`text-lg font-bold ${
                                  r.verdict === 'likely-authentic' ? 'text-emerald-300' :
                                  r.verdict === 'inconclusive' ? 'text-amber-300' : 'text-red-300'
                                }`}>
                                  {r.verdict === 'likely-authentic' ? 'Likely authentic' :
                                   r.verdict === 'inconclusive' ? 'Inconclusive' : 'Likely fake'}
                                </span>
                              </div>
                              <div className="font-mono text-lg">{r.overallScore}<span className="text-dim text-sm">/100</span></div>
                            </div>
                            <div className="text-xs text-dim mt-0.5">Closest profile: <span className="font-mono">{r.materialName}</span></div>
                            {r.flags.length > 0 && (
                              <ul className="text-sm text-neutral-200 space-y-1 mt-1.5">
                                {r.flags.map((f, i) => (
                                  <li key={i} className="flex gap-2"><span className="text-accent-bright">▸</span><span>{f}</span></li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <div className="text-sm"><span className="text-dim">{t.label}:</span> <span className="text-dim">not measured</span></div>
                        )}
                      </div>
                    );
                  })}
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
                  setReadingsByTarget({ case: {}, bracelet: {}, 'case-back': {} });
                  setCsvByTarget({ case: '', bracelet: '', 'case-back': '' });
                  setActiveTarget('case');
                  setExamined(null); setReference(null);
                  setSerial(''); setNotes(''); setObservedCaliber('');
                  setXrfResultByTarget({ case: null, bracelet: null, 'case-back': null });
                  setMovementResult(null);
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

      {/* Metal-mismatch warning modal */}
      {showMetalWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 fade-in" role="dialog" aria-modal="true">
          <div className="w-full max-w-md card p-6 space-y-4 border-l-4" style={{ borderLeftColor: '#ef4444' }}>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <div>
                <h3 className="text-lg font-bold text-red-300">Metal composition does not match</h3>
                <p className="text-sm text-muted mt-1">
                  One or more measured parts do not match {currentBrand.name}:
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-soft pt-3">
              {XRF_TARGETS
                .map((t) => ({ t, r: liveXrfByTarget[t.id] }))
                .filter((x) => x.r?.verdict === 'likely-fake')
                .map(({ t, r }) => (
                  <div key={t.id}>
                    <div className="text-sm font-semibold text-red-300">
                      {t.label} — {r!.materialName} ({r!.overallScore}/100)
                    </div>
                    {r!.flags.length > 0 && (
                      <ul className="text-xs text-neutral-300 space-y-1 mt-1">
                        {r!.flags.slice(0, 2).map((f, i) => (
                          <li key={i} className="flex gap-2"><span className="text-red-400">▸</span><span>{f}</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>

            <p className="text-sm text-foreground">Do you want to continue with the authentication anyway?</p>

            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setShowMetalWarning(false)} className="btn-ghost text-sm">
                Stop here
              </button>
              <button
                onClick={() => { setShowMetalWarning(false); advance(); }}
                className="btn-primary text-sm"
                style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}
              >
                Continue anyway
              </button>
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
