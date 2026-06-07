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
import { parseDecimal } from '@/lib/num';
import { useLang, type Lang } from '@/lib/i18n';
import { usePro } from '@/lib/pro';
import { authHeaders } from '@/lib/billing-client';
import { handlePaywall } from '@/lib/paywall';
import { MetalModeBanner } from '@/app/metal-mode-banner';
import { getTimingReading, type TimingReading } from '@/lib/timing-store';

/** Bilingual string pair. */
type Bi = { es: string; en: string };

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
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
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

function verdictText(v: MatchResult['verdict'], lang: Lang): string {
  if (v === 'likely-authentic') return lang === 'es' ? 'Probablemente auténtico' : 'Likely authentic';
  if (v === 'inconclusive') return lang === 'es' ? 'No concluyente' : 'Inconclusive';
  return lang === 'es' ? 'Probablemente falso' : 'Likely fake';
}

const ELEMENTS_OF_INTEREST: ElementSymbol[] = [
  'Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si',
  'Au', 'Ag', 'Pt', 'Pd', 'Ru',
];

const PARTS: readonly { id: WatchPart; label: Bi }[] = [
  { id: 'movement', label: { es: 'Movimiento', en: 'Movement' } },
  { id: 'hands', label: { es: 'Agujas', en: 'Hands' } },
  { id: 'logo', label: { es: 'Logo / corona', en: 'Logo / crown' } },
  { id: 'dial', label: { es: 'Esfera', en: 'Dial' } },
  { id: 'serial-number', label: { es: 'Número de serie', en: 'Serial number' } },
  { id: 'case-back', label: { es: 'Tapa trasera', en: 'Case back' } },
  { id: 'bezel', label: { es: 'Bisel', en: 'Bezel' } },
  { id: 'bracelet-link', label: { es: 'Brazalete', en: 'Bracelet' } },
  { id: 'clasp', label: { es: 'Cierre', en: 'Clasp' } },
];

type Step = 0 | 1 | 2 | 3 | 4;
const STEP_LABELS: readonly Bi[] = [
  { es: 'Reloj', en: 'Watch' },
  { es: 'Medición XRF', en: 'XRF measurement' },
  { es: 'Movimiento', en: 'Movement' },
  { es: 'Evidencia visual', en: 'Visual evidence' },
  { es: 'Veredicto', en: 'Verdict' },
];

type XrfMode = 'manual' | 'connected' | 'photo' | 'skip';

/** Independently-measured metal targets on the watch. Each keeps its own reading. */
type XrfTarget = 'case' | 'bracelet' | 'case-back';
const XRF_TARGETS: readonly { id: XrfTarget; label: Bi; hint: Bi }[] = [
  { id: 'case', label: { es: 'Caja', en: 'Case' }, hint: { es: 'cuerpo de la caja / asas', en: 'main case body / lugs' } },
  { id: 'bracelet', label: { es: 'Brazalete', en: 'Bracelet' }, hint: { es: 'un eslabón del brazalete o el cierre', en: 'a metal bracelet link or the clasp' } },
  { id: 'case-back', label: { es: 'Tapa trasera', en: 'Case back' }, hint: { es: 'la tapa roscada', en: 'the screw-down back' } },
];

type StepStatus = 'pass' | 'fail' | 'warn' | 'pending';

const STATUS_STYLE: Record<StepStatus, { color: string; bg: string; border: string; label: Bi }> = {
  pass:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.4)',  label: { es: 'OK', en: 'Pass' } },
  fail:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   label: { es: 'Falla', en: 'Fail' } },
  warn:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)',  label: { es: 'Revisar', en: 'Check' } },
  pending: { color: '#64748b', bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.3)', label: { es: 'Pendiente', en: 'Pending' } },
};

/** Small flag icon coloured by exam status. Pending shows a faint dash. */
function StatusFlag({ status, size = 16 }: { status: StepStatus; size?: number }) {
  const { lang } = useLang();
  const c = STATUS_STYLE[status].color;
  if (status === 'pending') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" aria-label="pending">
        <line x1="6" y1="12" x2="18" y2="12" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={STATUS_STYLE[status].label[lang]}>
      <path d="M4 21V4" />
      <path d="M4 4h11l-1.5 3.5L15 11H4" fill={c} fillOpacity="0.85" />
    </svg>
  );
}

/** Year selector restricted to a model's production range. Chips for short
 *  ranges, dropdown for long ones. */
function YearPicker({ years, value, onChange }: { years: number[]; value: number; onChange: (y: number) => void }) {
  const { t } = useLang();
  if (years.length === 0) {
    return <div className="text-sm text-dim">{t('No hay años de producción registrados.', 'No production years on file.')}</div>;
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
  const { lang } = useLang();
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
    >
      <StatusFlag status={status} size={13} />
      {s.label[lang]}
    </span>
  );
}

export default function AuthenticatePage() {
  const { t, lang } = useLang();
  const { pro } = usePro();
  const [step, setStep] = useState<Step>(0);

  // Step 1 — watch identification
  const [brandId, setBrandId] = useState<string>(ALL_BRANDS[0]!.id);
  const [audience, setAudience] = useState<'all' | 'men' | 'women' | 'unisex'>('all');
  const [modelSearch, setModelSearch] = useState('');
  const [modelId, setModelId] = useState<string>(ALL_MODELS[0]!.id);
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [serial, setSerial] = useState('');
  const [notes, setNotes] = useState('');
  // "Not in the list" mode: authenticate any watch by typing its model + reference.
  // The metal (XRF) match works by brand + year, so the exact catalog entry is optional.
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRef, setCustomRef] = useState('');
  // "Other brand" mode: authenticate a brand outside the catalog by typing its
  // name. The XRF match falls back to generic alloy profiles; movement is skipped.
  const [customBrand, setCustomBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');

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

  // Fallback list (all of the brand's models) so the dropdown is never stuck
  // on a disabled "No matches" state when the search matches nothing.
  const groupedAllModels = useMemo(() => {
    const groups = new Map<string, typeof ALL_MODELS[number][]>();
    for (const m of brandModels) {
      const arr = groups.get(m.collection) ?? [];
      arr.push(m);
      groups.set(m.collection, arr);
    }
    return Array.from(groups.entries());
  }, [brandModels]);

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
  // Bumped whenever the analysed context changes, to discard stale AI responses.
  const aiGenRef = useRef(0);

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
  // Model is free-text whenever the custom-model toggle is on OR an off-catalog brand is typed.
  const modelCustom = customMode || customBrand;
  const effectiveBrandId = customBrand ? '__custom_brand__' : brandId;
  const identityKey = `${customBrand ? `cb:${customBrandName}` : brandId}/${modelCustom ? `custom:${customName}|${customRef}` : modelId}`;
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
    () => getReferenceProfilesForBrand(effectiveBrandId, year),
    [effectiveBrandId, year],
  );

  // Fall back to the first catalog entry if the id is momentarily out of sync
  // (e.g. just after a brand change) — never crash the render with a bad `!`.
  const catalogModel = ALL_MODELS.find((m) => m.id === modelId) ?? ALL_MODELS[0]!;
  // In "not in the list" / "other brand" mode, synthesise a model from the typed name/reference.
  const currentModel = modelCustom
    ? { ...catalogModel, id: '__custom__', name: customName.trim() || t('Modelo personalizado', 'Custom model'), reference: customRef.trim(), yearStart: 1950 }
    : catalogModel;
  // In "other brand" mode, synthesise a brand from the typed name.
  const currentBrand = customBrand
    ? { ...ALL_BRANDS[0]!, id: '__custom_brand__', name: customBrandName.trim() || t('Otra marca', 'Other brand') }
    : (ALL_BRANDS.find((b) => b.id === brandId) ?? ALL_BRANDS[0]!);
  // For the movement check, a custom watch has no known caliber → treat as unknown.
  const movementModelId = modelCustom ? '__custom__' : modelId;
  const expectedMovement = useMemo(() => getMovementForModelAcrossBrands(movementModelId), [movementModelId]);

  // Saved chronocomparator reading (shown in the verdict + included in the report).
  const [timing, setTiming] = useState<TimingReading | null>(null);
  useEffect(() => { if (step === 4) setTiming(getTimingReading()); }, [step]);

  // Native share availability (client-only to avoid hydration mismatch).
  const [canShare, setCanShare] = useState(false);
  useEffect(() => { setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'); }, []);

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
    () => checkMovementCaliber(movementModelId, observedCaliber),
    [movementModelId, observedCaliber],
  );

  // ===== Live exam results (recomputed as the user fills each step) =====
  // Computes a match result for one target's readings (manual/photo) or CSV (connected).
  const computeXrf = (tgtReadings: Record<string, string>, tgtCsv: string): MatchResult | null => {
    if (xrfMode === 'skip') return null;
    if (xrfMode === 'manual' || xrfMode === 'photo') {
      const er: ElementReading[] = Object.entries(tgtReadings)
        .map(([element, raw]) => ({ element: element as ElementSymbol, pct: parseDecimal(raw) }))
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

  // Move the guided XRF flow to a target (clears the transient photo-OCR UI).
  const goToTarget = (id: XrfTarget) => {
    setActiveTarget(id);
    setPhotoPreview(null);
    setPhotoNotes(null);
    setPhotoError(null);
  };

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

  // Release the camera if the user leaves the visual-evidence step with it open.
  useEffect(() => {
    if (step !== 3 && liveSide) {
      stopStream();
      setLiveSide(null);
    }
  }, [step, liveSide]);

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
      alert(`${t('Cámara no disponible', 'Camera not available')}: ${(err as Error).message}.`);
    }
  };

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || !liveSide) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    // The stream may not have delivered a frame yet — capturing now would write a
    // blank 0×0 image. Bail and let the user tap again.
    if (!vw || !vh) return;
    const scale = Math.min(1, 1600 / Math.max(vw, vh)); // cap the longest edge
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(vw * scale));
    canvas.height = Math.max(1, Math.round(vh * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
    aiGenRef.current++; // invalidate any in-flight AI request for the old context
    getPhotos(effectiveBrandId, movementModelId, examinedPart)
      .then((rows) => { if (alive) setGalleryPhotos(rows); })
      .catch(() => { if (alive) setGalleryPhotos([]); });
    setAiResult(null);
    setAiError(null);
    return () => { alive = false; };
  }, [effectiveBrandId, movementModelId, examinedPart]);

  // Run the AI vision analysis: compare the examined photo against gallery references
  const runAiAnalysis = async () => {
    if (!examined) { setAiError(t('Primero haz o sube una foto del reloj examinado.', 'Capture or upload a photo of the examined watch first.')); return; }
    const gen = aiGenRef.current;
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
      if (await handlePaywall(res)) return; // 402/429/403 → paywall sheet
      const json = await res.json();
      if (gen !== aiGenRef.current) return; // context changed → discard stale result
      if (!res.ok) { setAiError(json.error ?? t('Falló el análisis con IA.', 'AI analysis failed.')); return; }
      setAiResult(json as VisionResult);
    } catch (err) {
      if (gen === aiGenRef.current) setAiError((err as Error).message);
    } finally {
      if (gen === aiGenRef.current) setAiBusy(false);
    }
  };

  // Read a photo of the Niton screen with AI and fill in the readings
  const handleScreenPhoto = async (file: File) => {
    const target = activeTarget; // pin the part that triggered the capture
    setPhotoBusy(true);
    setPhotoError(null);
    setPhotoNotes(null);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(t('No se pudo leer el archivo.', 'Could not read the file.')));
        reader.readAsDataURL(file);
      });
      setPhotoPreview(dataUrl);
      const commaIdx = dataUrl.indexOf(',');
      const base64 = dataUrl.slice(commaIdx + 1);
      const mediaType = (dataUrl.slice(5, commaIdx).split(';')[0] || 'image/jpeg') as
        'image/jpeg' | 'image/png' | 'image/webp';

      const res = await postJsonWithRetry('/api/extract-xrf', { imageBase64: base64, mediaType });
      if (await handlePaywall(res)) return; // 402/429/403 → paywall sheet
      const json = await res.json();
      if (!res.ok) {
        setPhotoError(json.error ?? t('No se pudo leer la pantalla.', 'Could not read the screen.'));
        return;
      }
      const next: Record<string, string> = {};
      for (const r of json.readings as { element: string; pct: number }[]) {
        if (Number.isFinite(r.pct)) next[r.element] = String(r.pct);
      }
      if (Object.keys(next).length === 0) {
        setPhotoError(t('No se pudo leer ningún elemento de esta foto. Prueba una toma más nítida y de frente de la pantalla.', 'No elements could be read from this photo. Try a sharper, straight-on shot of the screen.'));
        return;
      }
      setReadingsByTarget((prev) => ({ ...prev, [target]: next }));
      setPhotoNotes(json.notes || t('Valores extraídos. Revisa y corrige los que parezcan erróneos antes de continuar.', 'Values extracted. Review and edit any that look wrong before continuing.'));
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
    setMovementResult(checkMovementCaliber(movementModelId, observedCaliber));
  };

  // Build a printable authentication report (client gives "Save as PDF" in print).
  const downloadReport = () => {
    const esc = (s: unknown) =>
      String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const vLabel = (v: MatchResult['verdict']) => verdictText(v, lang);
    const vClass = (v: MatchResult['verdict']) =>
      v === 'likely-authentic' ? 'v-auth' : v === 'inconclusive' ? 'v-incon' : 'v-fake';

    const xrfResults = XRF_TARGETS.map((tg) => ({ tg, r: xrfResultByTarget[tg.id] })).filter((x) => x.r);
    const verdicts = xrfResults.map((x) => x.r!.verdict);
    const anyFake = verdicts.includes('likely-fake') || movementResult?.status === 'mismatch';
    const anyIncon = verdicts.includes('inconclusive');
    const hasData = verdicts.length > 0 || movementResult?.status === 'match';
    const overall = anyFake
      ? { t: t('Probablemente falso / inconsistente', 'Likely fake / inconsistent'), c: 'v-fake' }
      : anyIncon
        ? { t: t('No concluyente', 'Inconclusive'), c: 'v-incon' }
        : hasData
          ? { t: t('Compatible con auténtico', 'Consistent with authentic'), c: 'v-auth' }
          : { t: t('Datos insuficientes', 'Insufficient data'), c: 'v-incon' };

    const dateStr = new Date().toLocaleString();

    const xrfRows = xrfResults.map(({ tg, r }) => `
      <div class="block">
        <div class="row"><strong>${esc(tg.label[lang])}</strong>
          <span class="badge ${vClass(r!.verdict)}">${vLabel(r!.verdict)}</span>
          <span class="muted">${r!.overallScore}/100</span></div>
        <div class="muted">${t('Perfil más cercano', 'Closest profile')}: ${esc(r!.materialName)}</div>
        ${r!.flags.length ? `<ul>${r!.flags.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      </div>`).join('');

    const movHtml = movementResult ? `
      <h3>${t('Comprobación del calibre', 'Movement caliber check')}</h3>
      <div class="block">
        <div>${movementResult.status === 'match' ? '&#10003; ' + t('El calibre coincide', 'Caliber matches')
          : movementResult.status === 'mismatch' ? '&#10007; ' + t('Calibre no coincide', 'Caliber mismatch')
          : movementResult.status === 'not-provided' ? t('No aportado', 'Not provided') : t('Modelo desconocido', 'Unknown model')}</div>
        ${movementResult.expectedCaliber ? `<div class="muted">${t('Esperado', 'Expected')} Cal. ${esc(movementResult.expectedCaliber)}${movementResult.observedCaliber ? ' &middot; ' + t('observado', 'observed') + ' ' + esc(movementResult.observedCaliber) : ''}</div>` : ''}
        ${movementResult.note ? `<div class="muted">${esc(movementResult.note)}</div>` : ''}
      </div>` : '';

    const imgsHtml = (examined || reference) ? `
      <h3>${t('Evidencia visual', 'Visual evidence')}</h3>
      <div class="imgs">
        ${examined ? `<figure><img src="${examined}" alt="examined"/><figcaption>${t('Examinado', 'Examined')}</figcaption></figure>` : ''}
        ${reference ? `<figure><img src="${reference}" alt="reference"/><figcaption>${t('Referencia', 'Reference')}</figcaption></figure>` : ''}
      </div>` : '';

    const tr = getTimingReading();
    const timingHtml = tr ? `
      <h3>${t('Marcha (cronocomparador)', 'Timing (chronocomparator)')}</h3>
      <div class="block">
        <div>${t('Marcha', 'Rate')}: <strong>${tr.rate >= 0 ? '+' : ''}${esc(tr.rate.toFixed(1))} s/${t('día', 'day')}</strong>${tr.beatError != null ? ` &middot; ${t('Error de batido', 'Beat error')}: ${esc(tr.beatError.toFixed(1))} ms` : ''} &middot; ${esc(Math.round(tr.detectedBph))} bph</div>
      </div>` : '';

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${t('Informe de autenticación', 'Authentication report')} — ${esc(currentModel.name)}</title>
<style>
  *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:18px;line-height:1.3;font-size:12.5px}
  h1{font-size:18px;margin:0} h3{font-size:12.5px;margin:12px 0 4px;border-bottom:1px solid #eee;padding-bottom:3px}
  .muted{color:#666;font-size:11px} .block{margin:5px 0;font-size:12px}
  .row{display:flex;align-items:center;gap:8px} ul{margin:3px 0 0 15px;padding:0;font-size:11px;color:#333} ul li{margin:1px 0}
  .badge{font-size:11px;font-weight:bold;padding:1px 6px;border-radius:5px}
  .v-auth{background:#e6f7ee;color:#137a4a} .v-incon{background:#fff6e5;color:#9a6700} .v-fake{background:#fdeaea;color:#b42318}
  .overall{font-size:15px;padding:4px 11px;border-radius:7px;display:inline-block;margin-top:3px}
  .imgs{display:flex;gap:10px;flex-wrap:wrap} .imgs img{max-width:150px;max-height:150px;border:1px solid #ddd;border-radius:6px}
  figure{margin:0} figcaption{font-size:10px;color:#666;text-align:center;margin-top:2px}
  .disclaimer{font-size:9.5px;color:#888;margin-top:14px;border-top:1px solid #eee;padding-top:6px}
  .toolbar{position:sticky;top:0;background:#fff;padding:0 0 8px;margin-bottom:6px;border-bottom:1px solid #eee;display:flex;gap:8px}
  .toolbar button{font:inherit;font-size:13px;padding:8px 16px;border-radius:8px;border:1px solid #2563eb;background:#2563eb;color:#fff;cursor:pointer}
  .toolbar button.sec{background:#fff;color:#2563eb}
  @media print{body{margin:10px}.no-print{display:none!important}}
</style></head><body>
  <div class="toolbar no-print">
    <button onclick="window.print()">${t('Imprimir / Guardar PDF', 'Print / Save as PDF')}</button>
    <button class="sec" onclick="window.close()">${t('Cerrar', 'Close')}</button>
  </div>
  <h1>${t('Informe de autenticación de reloj', 'Watch Authentication Report')}</h1>
  <div class="muted">${t('Generado', 'Generated')} ${esc(dateStr)} &middot; Watch Authenticator</div>
  <div class="block">
    <div><strong>${esc(currentBrand.name)} ${esc(currentModel.name)}</strong> (ref. ${esc(currentModel.reference)})</div>
    <div class="muted">${t('Año declarado', 'Declared year')}: ${esc(year)}${serial ? ' &middot; ' + t('Serie', 'Serial') + ': ' + esc(serial) : ''}</div>
    ${notes ? `<div class="muted">${t('Notas', 'Notes')}: ${esc(notes)}</div>` : ''}
  </div>
  <div><span class="overall badge ${overall.c}">${esc(overall.t)}</span></div>
  <h3>${t('Análisis de composición XRF (por parte)', 'XRF composition analysis (per part)')}</h3>
  ${xrfRows || `<div class="muted">${t('No se introdujeron lecturas XRF.', 'No XRF readings were entered.')}</div>`}
  ${movHtml}
  ${timingHtml}
  ${imgsHtml}
  <div class="disclaimer">${t('Este informe es una guía de apoyo a la decisión basada en datos públicos de referencia y en las lecturas aportadas. No es una garantía de autenticidad; la autenticación definitiva requiere inspección física por un profesional cualificado.', 'This report is decision-support guidance based on public reference data and the readings provided. It is not a guarantee of authenticity; definitive authentication requires physical inspection by a qualified professional.')}</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) { alert(t('Permite las ventanas emergentes de este sitio para generar el informe e inténtalo de nuevo.', 'Allow pop-ups for this site to generate the report, then try again.')); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch { /* user can still print manually */ } }, 350);
  };

  // Plain-text summary used for share / email / message.
  const reportSummaryText = (): string => {
    const xr = XRF_TARGETS.map((tg) => ({ tg, r: xrfResultByTarget[tg.id] })).filter((x) => x.r);
    const verdicts = xr.map((x) => x.r!.verdict);
    const anyFake = verdicts.includes('likely-fake') || movementResult?.status === 'mismatch';
    const anyIncon = verdicts.includes('inconclusive');
    const hasData = verdicts.length > 0 || movementResult?.status === 'match';
    const overall = anyFake ? t('Probablemente falso / inconsistente', 'Likely fake / inconsistent')
      : anyIncon ? t('No concluyente', 'Inconclusive') : hasData ? t('Compatible con auténtico', 'Consistent with authentic') : t('Datos insuficientes', 'Insufficient data');

    const lines: string[] = [];
    lines.push(`${t('Autenticación de reloj', 'Watch authentication')} — ${currentBrand.name} ${currentModel.name} (ref. ${currentModel.reference})`);
    lines.push(`${t('Año', 'Year')}: ${year}${serial ? ` · ${t('Serie', 'Serial')}: ${serial}` : ''}`);
    lines.push(`${t('Resultado', 'Overall')}: ${overall}`);
    for (const { tg, r } of xr) lines.push(`XRF ${tg.label[lang]}: ${verdictText(r!.verdict, lang)} (${r!.overallScore}/100, ${r!.materialName})`);
    if (movementResult) {
      const m = movementResult.status === 'match' ? t('el calibre coincide', 'caliber matches')
        : movementResult.status === 'mismatch' ? t('calibre NO COINCIDE', 'caliber MISMATCH')
        : movementResult.status === 'not-provided' ? t('no aportado', 'not provided') : t('modelo desconocido', 'unknown model');
      lines.push(`${t('Movimiento', 'Movement')}: ${m}${movementResult.expectedCaliber ? ` (${t('esperado', 'expected')} ${movementResult.expectedCaliber}${movementResult.observedCaliber ? `, ${t('observado', 'observed')} ${movementResult.observedCaliber}` : ''})` : ''}`);
    }
    const tr = getTimingReading();
    if (tr) lines.push(`${t('Marcha', 'Timing')}: ${tr.rate >= 0 ? '+' : ''}${tr.rate.toFixed(1)} s/${t('día', 'day')}${tr.beatError != null ? `, ${t('error de batido', 'beat error')} ${tr.beatError.toFixed(1)} ms` : ''}, ${Math.round(tr.detectedBph)} bph`);
    lines.push(`${t('Generado', 'Generated')} ${new Date().toLocaleString()} · Watch Authenticator`);
    return lines.join('\n');
  };

  const reportTitle = () => `${t('Autenticación', 'Authentication')} — ${currentBrand.name} ${currentModel.name} (${currentModel.reference})`;

  const shareReport = async () => {
    const text = reportSummaryText();
    try {
      if (navigator.share) await navigator.share({ title: reportTitle(), text });
      else window.location.href = `mailto:?subject=${encodeURIComponent(reportTitle())}&body=${encodeURIComponent(text)}`;
    } catch { /* user cancelled the share sheet */ }
  };

  const emailReport = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(reportTitle())}&body=${encodeURIComponent(reportSummaryText())}`;
  };

  const whatsappReport = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(reportSummaryText())}`, '_blank');
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
    if (step === 0) {
      const brandOk = customBrand ? customBrandName.trim().length > 0 : true;
      const idOk = modelCustom ? (customName.trim().length > 0 || customRef.trim().length > 0) : !!modelId;
      return brandOk && idOk && !!year;
    }
    if (step === 1) {
      if (xrfMode === 'skip') return true;
      if (xrfMode === 'manual' || xrfMode === 'photo')
        return XRF_TARGETS.some((t) => Object.values(readingsByTarget[t.id]).some((v) => parseDecimal(v) > 0));
      return XRF_TARGETS.some((t) => csvByTarget[t.id].trim().length > 0); // connected
    }
    if (step === 2) return true; // movement step is optional
    if (step === 3) return true;
    return false;
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Autenticación guiada', 'Guided authentication')}</h1>
        <p className="text-muted text-sm">
          {t(
            'Un asistente de 5 pasos: identifica el reloj, mide el metal, comprueba el calibre del movimiento, reúne evidencia visual y lee el veredicto final.',
            'A five-step wizard: identify the watch, capture the XRF reading, cross-check the movement caliber, gather visual evidence, and read the combined verdict.',
          )}
        </p>
      </section>

      <StepHeader step={step} statuses={stepStatuses} onJump={(s) => setStep(s)} />

      {step === 0 && (
        <StepCard title={t('1. Identifica el reloj', '1. Watch identification')} subtitle={t('Dile a la app qué pieza estás revisando.', 'Tell the app which piece you are inspecting.')} status={stepStatuses[0]}>
          <div className="mb-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-xs uppercase tracking-wide text-dim">{t('Marca', 'Brand')}</span>
                <button type="button" onClick={() => { setCustomBrand((v) => !v); setModelSearch(''); }} className="text-xs text-accent-bright hover:underline shrink-0">
                  {customBrand ? t('Elegir del catálogo', 'Pick from catalog') : t('Otra marca', 'Other brand')}
                </button>
              </div>
              {customBrand ? (
                <div className="space-y-2">
                  <input value={customBrandName} onChange={(e) => setCustomBrandName(e.target.value)} className="field" placeholder={t('Marca (p. ej. Omega, Cartier, Seiko…)', 'Brand (e.g. Omega, Cartier, Seiko…)')} />
                  <span className="block text-xs text-dim">{t('Para marcas fuera del catálogo. El metal (XRF) se comprueba contra aleaciones genéricas (acero, oro 18k…) por año; el calibre se omite.', 'For brands outside the catalog. The metal (XRF) is checked against generic alloys (steel, 18k gold…) by year; the caliber is skipped.')}</span>
                </div>
              ) : (
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
              )}
            </div>
            {!modelCustom && (<>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Busca por número de referencia, modelo o colección', 'Search by reference number, model or collection')}</span>
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
            </>)}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="block">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-xs uppercase tracking-wide text-dim">{t('Modelo', 'Model')}</span>
                {!customBrand && (
                  <button type="button" onClick={() => setCustomMode((v) => !v)} className="text-xs text-accent-bright hover:underline shrink-0">
                    {customMode ? t('Elegir del catálogo', 'Pick from catalog') : t('No está en la lista', 'Not in the list')}
                  </button>
                )}
              </div>
              {modelCustom ? (
                <div className="space-y-2">
                  <input value={customName} onChange={(e) => setCustomName(e.target.value)} className="field" placeholder={t('Modelo (p. ej. Datejust 41)', 'Model (e.g. Datejust 41)')} />
                  <input value={customRef} onChange={(e) => setCustomRef(e.target.value)} className="field font-mono" placeholder={t('Referencia (p. ej. 126333)', 'Reference (e.g. 126333)')} />
                  <span className="block text-xs text-dim">{t('La comprobación de metal (XRF) funciona por marca + año; el calibre del movimiento se omite.', 'The metal (XRF) check works by brand + year; the movement caliber is skipped.')}</span>
                </div>
              ) : (
                <>
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
                  {modelSearch && filteredModels.length === 0 && (
                    <span className="block text-xs text-amber-300 mt-1.5">
                      {t('Esa referencia no está en el catálogo.', 'That reference is not in the catalog.')}{' '}
                      <button type="button" onClick={() => { setCustomMode(true); setCustomRef(modelSearch.trim()); setModelSearch(''); }} className="underline font-medium">{t('Usar “Otra referencia”', 'Use “Other reference”')}</button>{' '}
                      {t('o', 'or')}{' '}
                      <button type="button" onClick={() => setModelSearch('')} className="underline">{t('limpia la búsqueda', 'clear the search')}</button>.
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">
                {t('Año de fabricación', 'Year of manufacture')}
                {!modelCustom && <span className="text-dim/70 normal-case ml-1">· {t('producido', 'produced')} {currentModel.yearStart}–{currentModel.yearEnd ?? t('presente', 'present')}</span>}
              </span>
              <YearPicker years={productionYears} value={year} onChange={setYear} />
            </div>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Número de serie (opcional)', 'Serial number (optional)')}</span>
              <input value={serial} onChange={(e) => setSerial(e.target.value)} className="field" placeholder={t('p. ej. M7P8', 'e.g. M7P8')} />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Notas (opcional)', 'Notes (optional)')}</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="field" placeholder={t('procedencia, estado, etc.', 'provenance, condition, etc.')} />
            </label>
          </div>
          <div className="text-xs text-dim mt-4">
            {candidateProfiles.length} {t('perfil(es) de referencia coinciden con este año.', 'reference profile(s) match this year.')}{' '}
            {candidateProfiles.length === 0 && t(`Elige otro año — ninguna referencia de ${currentBrand.name} cubre este periodo todavía.`, `Pick a different year — no ${currentBrand.name} reference covers this period yet.`)}
          </div>
        </StepCard>
      )}

      {step === 1 && (
        <StepCard title={t('2. Medición XRF', '2. XRF measurement')} subtitle={t('Elige cómo introducir la composición del Niton XL en la app.', 'Choose how you want to feed the Niton XL composition into the app.')} status={stepStatuses[1]}>
          <div className="mb-5">
            <MetalModeBanner />
          </div>
          {/* Input methods + skip ("Connected" CSV is a Pro-only advanced path) */}
          <div className={`grid grid-cols-2 ${pro ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-2 mb-5`}>
            <XrfModeButton mode="manual" current={xrfMode} onClick={setXrfMode} label={t('Escribirlo', 'Type it in')} desc={t('Introduce el % a mano', 'Enter the % by hand')} icon={
              <path d="M4 7h16M4 12h16M4 17h10" />
            } />
            {pro && <XrfModeButton mode="connected" current={xrfMode} onClick={setXrfMode} label={t('Conectado', 'Connected')} desc={t('Desde la máquina', 'From the machine')} icon={
              <><path d="M5 12h14" /><path d="M12 5v14" /><circle cx="12" cy="12" r="9" /></>
            } />}
            <XrfModeButton mode="photo" current={xrfMode} onClick={setXrfMode} label={t('Foto de la pantalla', 'Photo of screen')} desc={t('La IA la lee', 'AI reads it')} icon={
              <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>
            } />
            <XrfModeButton mode="skip" current={xrfMode} onClick={setXrfMode} label={t('Omitir XRF', 'Skip XRF')} desc={t('Sin lectura de metal', 'No metal reading')} icon={
              <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>
            } />
          </div>

          {/* Target selector: measure case / bracelet / case back independently */}
          {xrfMode !== 'skip' && (
            <div className="mb-5 rounded-lg border border-soft bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Mide cada parte por separado', 'Measure each part separately')}</div>
              <div className="flex flex-wrap gap-2">
                {XRF_TARGETS.map((tg) => {
                  const r = liveXrfByTarget[tg.id];
                  const st: StepStatus = !r
                    ? 'pending'
                    : r.verdict === 'likely-authentic'
                      ? 'pass'
                      : r.verdict === 'inconclusive'
                        ? 'warn'
                        : 'fail';
                  return (
                    <button
                      key={tg.id}
                      onClick={() => goToTarget(tg.id)}
                      className={`chip cursor-pointer inline-flex items-center gap-1.5 ${
                        activeTarget === tg.id ? '!bg-accent !text-white !border-transparent' : ''
                      }`}
                    >
                      <StatusFlag status={st} size={12} />
                      {tg.label[lang]}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-dim mt-2">
                {t('Midiendo ahora:', 'Now measuring:')}{' '}
                <span className="text-foreground font-semibold">
                  {XRF_TARGETS.find((tg) => tg.id === activeTarget)?.label[lang]}
                </span>{' '}
                ({XRF_TARGETS.find((tg) => tg.id === activeTarget)?.hint[lang]}). {t('Cada parte guarda su propia lectura — mide una parte, cambia de pestaña, mide la siguiente.', 'Each part keeps its own reading — scan a part, switch tab, scan the next.')}
              </div>
            </div>
          )}

          {/* Manual + photo both edit the same readings grid */}
          {(xrfMode === 'manual' || xrfMode === 'photo') && (
            <div className="space-y-4">
              {xrfMode === 'photo' && (
                <div className="rounded-lg border border-soft bg-card p-4 space-y-3">
                  <div className="text-sm font-semibold">{t('Fotografía la pantalla del Niton', 'Photograph the Niton screen')}</div>
                  <p className="text-xs text-muted">
                    {t(
                      'Haz una foto nítida y de frente de la pantalla del analizador con los porcentajes de los elementos. La IA los transcribe en los campos de abajo para que los revises.',
                      'Take a clear, straight-on photo of the analyzer screen showing the element percentages. The AI transcribes them into the fields below for you to review.',
                    )}
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
                      {photoBusy ? t('Leyendo…', 'Reading…') : t('Hacer foto', 'Take photo')}
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
                      {t('Subir desde archivos', 'Upload from files')}
                    </button>
                    {photoPreview && !photoBusy && (
                      <span className="text-xs text-emerald-300">✓ {t('Valores rellenados abajo — revísalos', 'Values filled below — review them')}</span>
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
                    <img src={photoPreview} alt={t('Pantalla del Niton', 'Niton screen')} className="rounded-lg border border-soft max-h-40 object-contain" />
                  )}
                  {photoNotes && <div className="text-xs text-emerald-200/80 border-t border-soft pt-2">{photoNotes}</div>}
                  {photoError && (
                    <div className="text-xs text-red-300 border-t border-red-500/30 pt-2">{photoError}</div>
                  )}
                </div>
              )}

              <div>
                <div className="text-xs uppercase tracking-wide text-dim mb-2">
                  {xrfMode === 'photo' ? t('Composición extraída — edita si hace falta (%)', 'Extracted composition — edit if needed (%)') : t('Composición (%)', 'Composition (%)')}
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
                <div className="text-xs text-dim mt-3">{t('Introduce al menos un elemento > 0 para avanzar.', 'Enter at least one element > 0 to advance.')}</div>
              </div>
            </div>
          )}

          {xrfMode === 'connected' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-soft bg-card p-4 space-y-2 text-sm">
                <div className="font-semibold">{t('Directo desde la máquina', 'Direct from the machine')}</div>
                <p className="text-xs text-muted leading-relaxed">
                  {t('El Niton XL exporta cada lectura como CSV (activa "Also Save CSV" en NDT / NitonConnect). Sube ese archivo o pega su contenido abajo. Para captura automática por Bluetooth o carpeta vigilada, configúralo en la página', 'The Niton XL exports each reading as a CSV (enable "Also Save CSV" in NDT / NitonConnect). Upload that file or paste its contents below. For automatic capture over Bluetooth or a watched folder, set it up on the')} <Link href="/connect" className="text-accent-bright hover:underline">{t('Conectar Niton', 'Connect Niton')}</Link>.
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
              <div className="text-xs text-dim">{t('Se usará la primera fila como medición principal.', 'First row will be used as the main measurement.')}</div>
            </div>
          )}

          {xrfMode === 'skip' && (
            <div className="text-sm text-muted">
              {t('Puedes continuar sin datos XRF. El veredicto se apoyará en la comprobación del movimiento y la evidencia visual.', 'You can proceed without XRF data. The verdict will rely on the movement check and visual evidence.')}
            </div>
          )}

          {/* Guided per-part flow: measure each part, see its result, then move on */}
          {xrfMode !== 'skip' && (() => {
            const idx = XRF_TARGETS.findIndex((t) => t.id === activeTarget);
            const cur = XRF_TARGETS[idx]!;
            const prev = XRF_TARGETS[idx - 1];
            const next = XRF_TARGETS[idx + 1];
            const r = liveXrfByTarget[activeTarget];
            const color = r
              ? (r.verdict === 'likely-authentic' ? 'text-emerald-300' : r.verdict === 'inconclusive' ? 'text-amber-300' : 'text-red-300')
              : '';
            return (
              <div className="mt-5 border-t border-soft pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs text-dim">
                    {t('Parte', 'Part')} <span className="text-foreground font-semibold">{idx + 1} {t('de', 'of')} {XRF_TARGETS.length}</span> — {t('midiendo', 'measuring')}{' '}
                    <span className="text-foreground font-semibold">{cur.label[lang]}</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    {XRF_TARGETS.map((tg, i) => (
                      <span
                        key={tg.id}
                        title={tg.label[lang]}
                        className={`w-2.5 h-2.5 rounded-full ${i === idx ? 'bg-accent ring-2 ring-accent/30' : liveXrfByTarget[tg.id] ? 'bg-emerald-400' : 'bg-soft'}`}
                      />
                    ))}
                  </div>
                </div>

                {r ? (
                  <div className="rounded-lg border border-soft bg-card p-4 fade-in">
                    <div className="flex justify-between items-baseline flex-wrap gap-2">
                      <div className="text-sm">
                        <span className="text-dim uppercase tracking-wide text-xs">{cur.label[lang]} · {t('resultado', 'result')}</span>
                        <span className={`font-bold ml-2 ${color}`}>{verdictText(r.verdict, lang)}</span>
                      </div>
                      <div className="font-mono">{r.overallScore}<span className="text-dim text-xs">/100</span></div>
                    </div>
                    <div className="text-xs text-dim mt-1">{t('Perfil más cercano', 'Closest profile')}: <span className="font-mono">{r.materialName}</span></div>
                    {r.flags.length > 0 && (
                      <ul className="text-xs text-neutral-200 space-y-1 mt-2">
                        {r.flags.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex gap-2"><span className="text-accent-bright">▸</span><span>{f}</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-dim">
                    {t('Mide la', 'Measure the')} <span className="text-foreground font-semibold">{cur.label[lang]}</span> {t('con la pistola (escribir, foto o CSV arriba) — u omítela si esta parte no es metal (p. ej. una correa de cuero).', 'with the gun (type, photo or CSV above) — or skip it if this part is not metal (e.g. a leather strap).')}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => prev && goToTarget(prev.id)}
                    disabled={!prev}
                    className="btn-ghost text-sm disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    {t('Parte anterior', 'Previous part')}
                  </button>
                  {next ? (
                    <button onClick={() => goToTarget(next.id)} className="btn-primary text-sm inline-flex items-center gap-1.5">
                      {r ? t(`Siguiente: mide la ${next.label.es}`, `Next: measure the ${next.label.en}`) : t(`Omitir — mide la ${next.label.es}`, `Skip — measure the ${next.label.en}`)}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </button>
                  ) : (
                    <button onClick={goNext} className="btn-primary text-sm inline-flex items-center gap-1.5">
                      {t('Terminar XRF — Continuar', 'Finish XRF — Continue')}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </StepCard>
      )}

      {step === 2 && (
        <StepCard
          title={t('3. Comprobación del calibre', '3. Movement caliber check')}
          subtitle={t('Compara el calibre grabado en el movimiento con el que esta referencia debería llevar.', 'Cross-check the caliber engraved on the movement against what the brand should have used in this reference.')}
          status={stepStatuses[2]}
        >
          {expectedMovement ? (
            <>
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div className="rounded-lg border border-soft bg-card p-4 space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-dim">{t('Calibre esperado', 'Expected caliber')}</div>
                    <div className="text-3xl font-bold text-gradient mt-1">Cal. {expectedMovement.caliber}</div>
                    <div className="text-xs text-dim mt-1">{t('Para', 'For')} {currentModel.name} ({currentModel.reference})</div>
                  </div>
                  <ul className="text-sm space-y-1.5">
                    <li className="flex justify-between"><span className="text-dim">{t('Rubíes', 'Jewels')}</span><span>{expectedMovement.jewels}</span></li>
                    <li className="flex justify-between"><span className="text-dim">{t('Reserva de marcha', 'Power reserve')}</span><span>{expectedMovement.powerReserveHours} h</span></li>
                    <li className="flex justify-between"><span className="text-dim">{t('Vibraciones / hora', 'Vibrations / hour')}</span><span>{expectedMovement.vph.toLocaleString()} ({(expectedMovement.vph / 7200).toFixed(0)} Hz)</span></li>
                    <li className="flex justify-between"><span className="text-dim">{t('Escape', 'Escapement')}</span><span className="capitalize">{expectedMovement.escapement}</span></li>
                    <li className="flex justify-between"><span className="text-dim">{t('Funciones', 'Functions')}</span><span className="capitalize">{expectedMovement.features.join(', ')}</span></li>
                    <li className="flex justify-between"><span className="text-dim">{t('En producción', 'In production')}</span><span>{expectedMovement.yearStart}–{expectedMovement.yearEnd ?? t('presente', 'present')}</span></li>
                    <li className="flex justify-between"><span className="text-dim">COSC</span><span>{expectedMovement.cosc ? t('Sí', 'Yes') : 'No'}</span></li>
                  </ul>
                  {expectedMovement.notes && (
                    <p className="text-xs text-muted leading-relaxed border-t border-soft pt-3">{expectedMovement.notes}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Calibre grabado en el movimiento', 'Caliber engraved on the movement')}</span>
                    <input
                      value={observedCaliber}
                      onChange={(e) => setObservedCaliber(e.target.value)}
                      className="field text-lg font-mono"
                      placeholder={t('p. ej. 3235', 'e.g. 3235')}
                    />
                    <span className="block text-xs text-dim mt-1">
                      {t('Abre la tapa trasera y lee el número en el rotor o en la platina. Puedes escribir "Cal. 3235" o solo "3235" — ambos valen.', 'Open the case-back and read the number on the rotor or the main plate. You can write "Cal. 3235" or just "3235" — both work.')}
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
                          <div className="font-semibold mb-1">✓ {t('Coincide', 'Match')}</div>
                          <div className="text-xs">{livePreview.note}</div>
                        </>
                      )}
                      {livePreview.status === 'mismatch' && (
                        <>
                          <div className="font-semibold mb-1">✗ {t('No coincide', 'Mismatch')}</div>
                          <div className="text-xs">{livePreview.note}</div>
                        </>
                      )}
                      {livePreview.status === 'not-provided' && (
                        <>
                          <div className="font-semibold mb-1">{t('Esperando dato', 'Waiting for input')}</div>
                          <div className="text-xs">{livePreview.note}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-dim">{t('Este paso es opcional — puedes avanzar sin rellenar el calibre observado.', 'This step is optional — you can advance without filling in the observed caliber.')}</div>
            </>
          ) : (
            <div className="text-sm text-muted">
              {t('Aún no hay calibre de referencia para este modelo.', 'No reference caliber on file for this model yet.')}
            </div>
          )}
        </StepCard>
      )}

      {step === 3 && (
        <StepCard title={t('4. Evidencia visual (opcional)', '4. Visual evidence (optional)')} subtitle={t('Captura el reloj examinado y una referencia auténtica de la misma parte.', 'Capture the examined watch and an authentic reference for the same part.')} status={stepStatuses[3]}>
          <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Parte del reloj', 'Watch part')}</div>
          <div className="flex flex-wrap gap-2 mb-5">
            {PARTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setExaminedPart(p.id)}
                className={`chip cursor-pointer ${examinedPart === p.id ? '!bg-accent !text-white !border-transparent' : ''}`}
              >
                {p.label[lang]}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <PhotoSlot
              title={t('Reloj examinado', 'Examined watch')}
              dataUrl={examined}
              onCamera={() => openCamera('examined')}
              onUpload={() => examinedRef.current?.click()}
              onReset={() => setExamined(null)}
            />
            <PhotoSlot
              title={t('Referencia auténtica', 'Authentic reference')}
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
                {t('Tus fotos de referencia', 'Your reference photos')} · {currentModel.name} · {PARTS.find((p) => p.id === examinedPart)?.label[lang]}
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
                <h3 className="font-semibold">{t('Análisis visual con IA', 'AI visual analysis')}</h3>
              </div>
              <button onClick={() => void runAiAnalysis()} disabled={aiBusy || !examined} className="btn-primary text-sm">
                {aiBusy ? t('Analizando…', 'Analyzing…') : t('Analizar con IA', 'Analyze with AI')}
              </button>
            </div>
            <p className="text-xs text-muted">
              {t('La IA compara la foto de', 'The AI compares the examined')} {PARTS.find((p) => p.id === examinedPart)?.label[lang].toLowerCase()} {t('con tus', 'photo against your')}
              {galleryPhotos.length > 0 ? t(` ${Math.min(galleryPhotos.length, 4)} referencia(s) de la galería`, ` ${Math.min(galleryPhotos.length, 4)} gallery reference(s)`) : t(' foto de referencia', ' reference photo')} {t('y señala inconsistencias visuales.', 'and flags visual inconsistencies.')}
              {galleryPhotos.length === 0 && !reference && t(' Añade fotos en la Galería de referencia, o captura una arriba, para una comparación más fuerte.', ' Add reference photos in the Reference gallery, or capture one above, for a stronger comparison.')}
            </p>

            {aiError && <div className="text-xs text-red-300 border-t border-red-500/30 pt-2">{aiError}</div>}

            {aiResult && (
              <div className="fade-in space-y-2 border-t border-soft pt-3">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <span className={`text-lg font-bold ${
                    aiResult.verdict === 'consistent' ? 'text-emerald-300' :
                    aiResult.verdict === 'suspicious' ? 'text-red-300' : 'text-amber-300'
                  }`}>
                    {aiResult.verdict === 'consistent' ? t('Compatible con auténtico', 'Consistent with authentic') :
                     aiResult.verdict === 'suspicious' ? t('Sospechoso — revisar', 'Suspicious — review') : t('No concluyente', 'Inconclusive')}
                  </span>
                  <span className="text-xs text-dim">{t('confianza', 'confidence')} {Math.round((aiResult.confidence ?? 0) * 100)}%</span>
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
                <p className="text-[0.7rem] text-dim pt-1">{t('Solo orientación de la IA — la autenticación final requiere inspección física en mano.', 'AI guidance only — final authentication requires physical inspection in hand.')}</p>
              </div>
            )}
          </div>

          {/* Authentication guide (per brand) */}
          {getBrandCheckpoints(effectiveBrandId).length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-bright">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <h3 className="font-semibold">{t('Lista de autenticación — qué comparar', 'Authentication checklist — what to compare')}</h3>
              </div>
              <p className="text-xs text-muted">
                {t(`Guía de referencia para ${currentBrand.name}. Compara cada punto con tu propia pieza auténtica verificada — esta guía te dice qué buscar.`, `Textual reference guide for ${currentBrand.name}. Compare each point against your own verified authentic piece — this guide tells you what to look for.`)}
              </p>

              {/* Movement-specific points when the movement part is selected */}
              {examinedPart === 'movement' && expectedMovement && getMovementCheckpoints(expectedMovement.caliber).length > 0 && (
                <div className="rounded-lg border border-accent/40 bg-accent-soft p-4">
                  <div className="text-sm font-semibold text-accent-bright mb-2">
                    {t('Movimiento', 'Movement')} · Cal. {expectedMovement.caliber}
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
                {getBrandCheckpoints(effectiveBrandId).map((cp) => (
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
        <StepCard title={t('5. Veredicto final', '5. Combined verdict')} subtitle={t(`Resultado de ${currentModel.name} (ref. ${currentModel.reference}), año declarado ${year}.`, `Result for ${currentModel.name} (ref. ${currentModel.reference}), declared year ${year}.`)} status={stepStatuses[4]}>
          <div className="space-y-6">
            <SummaryBlock title={t('Identificación', 'Identification')}>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div><span className="text-dim">{t('Modelo', 'Model')}:</span> {currentModel.name} ({currentModel.reference})</div>
                <div><span className="text-dim">{t('Año', 'Year')}:</span> {year}</div>
                {serial && <div><span className="text-dim">{t('Serie', 'Serial')}:</span> {serial}</div>}
                {notes && <div><span className="text-dim">{t('Notas', 'Notes')}:</span> {notes}</div>}
              </div>
            </SummaryBlock>

            <SummaryBlock title={t('Análisis XRF — por parte', 'XRF analysis — per part')}>
              {Object.values(xrfResultByTarget).some(Boolean) ? (
                <div className="space-y-4">
                  {XRF_TARGETS.map((tg) => {
                    const r = xrfResultByTarget[tg.id];
                    return (
                      <div key={tg.id} className="border-t border-soft pt-3 first:border-t-0 first:pt-0">
                        {r ? (
                          <>
                            <div className="flex justify-between items-baseline flex-wrap gap-2">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-xs uppercase tracking-wide text-dim">{tg.label[lang]}</span>
                                <span className={`text-lg font-bold ${
                                  r.verdict === 'likely-authentic' ? 'text-emerald-300' :
                                  r.verdict === 'inconclusive' ? 'text-amber-300' : 'text-red-300'
                                }`}>
                                  {verdictText(r.verdict, lang)}
                                </span>
                              </div>
                              <div className="font-mono text-lg">{r.overallScore}<span className="text-dim text-sm">/100</span></div>
                            </div>
                            <div className="text-xs text-dim mt-0.5">{t('Perfil más cercano', 'Closest profile')}: <span className="font-mono">{r.materialName}</span></div>
                            {r.flags.length > 0 && (
                              <ul className="text-sm text-neutral-200 space-y-1 mt-1.5">
                                {r.flags.map((f, i) => (
                                  <li key={i} className="flex gap-2"><span className="text-accent-bright">▸</span><span>{f}</span></li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <div className="text-sm"><span className="text-dim">{tg.label[lang]}:</span> <span className="text-dim">{t('no medido', 'not measured')}</span></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-dim">{t('Se omitió el XRF o no se introdujeron lecturas.', 'XRF was skipped or no readings were entered.')}</div>
              )}
            </SummaryBlock>

            <SummaryBlock title={t('Comprobación del movimiento', 'Movement check')}>
              {movementResult ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div className={`text-lg font-semibold ${
                      movementResult.status === 'match' ? 'text-emerald-300'
                      : movementResult.status === 'mismatch' ? 'text-red-300'
                      : 'text-amber-300'
                    }`}>
                      {movementResult.status === 'match' ? '✓ ' + t('El calibre coincide', 'Caliber matches')
                      : movementResult.status === 'mismatch' ? '✗ ' + t('Calibre no coincide', 'Caliber mismatch')
                      : movementResult.status === 'not-provided' ? t('No aportado', 'Not provided')
                      : t('Modelo desconocido', 'Unknown model')}
                    </div>
                    {movementResult.expectedCaliber && (
                      <div className="text-sm text-muted">{t('esperado', 'expected')} <span className="font-mono">Cal. {movementResult.expectedCaliber}</span></div>
                    )}
                    {movementResult.observedCaliber && (
                      <div className="text-sm text-muted">{t('observado', 'observed')} <span className="font-mono">{movementResult.observedCaliber}</span></div>
                    )}
                  </div>
                  {movementResult.note && <div className="text-xs text-muted">{movementResult.note}</div>}
                </div>
              ) : (
                <div className="text-sm text-dim">{t('Se omitió la comprobación del movimiento.', 'Movement check was skipped.')}</div>
              )}
            </SummaryBlock>

            <SummaryBlock title={t('Marcha (cronocomparador)', 'Timing (chronocomparator)')}>
              {timing ? (
                <div className="space-y-1 text-sm">
                  <div><span className="text-dim">{t('Marcha', 'Rate')}:</span> <span className="font-mono">{timing.rate >= 0 ? '+' : ''}{timing.rate.toFixed(1)} s/{t('día', 'day')}</span></div>
                  {timing.beatError != null && <div><span className="text-dim">{t('Error de batido', 'Beat error')}:</span> <span className="font-mono">{timing.beatError.toFixed(1)} ms</span></div>}
                  <div><span className="text-dim">{t('Frecuencia', 'Frequency')}:</span> <span className="font-mono">{Math.round(timing.detectedBph)} bph</span></div>
                </div>
              ) : (
                <div className="text-sm text-dim">{t('No hay marcha guardada. Mídela en', 'No timing saved. Measure it in')} <Link href="/timegrapher" className="text-accent-bright hover:underline">{t('Cronocomparador', 'Timegrapher')}</Link> {t('y pulsa "Guardar lectura para el informe".', 'and tap "Save reading for report".')}</div>
              )}
            </SummaryBlock>

            <SummaryBlock title={t('Evidencia visual', 'Visual evidence')}>
              {examined || reference ? (
                <div className="grid md:grid-cols-2 gap-3">
                  <PhotoView title={t('Examinado', 'Examined')} dataUrl={examined} />
                  <PhotoView title={t('Referencia', 'Reference')} dataUrl={reference} />
                </div>
              ) : (
                <div className="text-sm text-dim">{t('No se capturaron fotos.', 'No photos captured.')}</div>
              )}
              <div className="text-xs text-dim mt-3">
                {t('El análisis visual con IA mostrará observaciones en lenguaje natural sobre las fotos cuando esté disponible.', 'AI visual analysis will show natural-language findings about the photos when available.')}
              </div>
            </SummaryBlock>

            <div className="flex gap-2 flex-wrap items-center">
              <button onClick={downloadReport} className="btn-primary text-sm inline-flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                </svg>
                {t('Imprimir / Guardar PDF', 'Print / Save PDF')}
              </button>
              {canShare && (
                <button onClick={() => void shareReport()} className="btn-ghost text-sm inline-flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  {t('Compartir', 'Share')}
                </button>
              )}
              <button onClick={emailReport} className="btn-ghost text-sm inline-flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
                </svg>
                {t('Correo', 'Email')}
              </button>
              <button onClick={whatsappReport} className="btn-ghost text-sm inline-flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                WhatsApp
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setReadingsByTarget({ case: {}, bracelet: {}, 'case-back': {} });
                  setCsvByTarget({ case: '', bracelet: '', 'case-back': '' });
                  setActiveTarget('case');
                  setExamined(null); setReference(null);
                  setSerial(''); setNotes(''); setObservedCaliber('');
                  setCustomMode(false); setCustomName(''); setCustomRef('');
                  setCustomBrand(false); setCustomBrandName('');
                  setXrfResultByTarget({ case: null, bracelet: null, 'case-back': null });
                  setMovementResult(null);
                }}
                className="btn-ghost text-sm ml-auto"
              >
                {t('Nuevo', 'New')}
              </button>
            </div>
          </div>
        </StepCard>
      )}

      <div className="flex justify-between gap-3">
        <button onClick={goBack} disabled={step === 0} className="btn-ghost text-sm disabled:opacity-30 disabled:cursor-not-allowed">
          ← {t('Atrás', 'Back')}
        </button>
        {step < 4 && (
          <button onClick={goNext} disabled={!canAdvance()} className="btn-primary text-sm">
            {step === 3 ? t('Analizar →', 'Run analysis →') : t('Continuar →', 'Continue →')}
          </button>
        )}
      </div>

      {liveSide && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 fade-in">
          <div className="w-full max-w-3xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted">
                {t('Capturando para', 'Capturing for')} <span className="text-accent-bright font-semibold">{liveSide === 'examined' ? t('examinado', 'examined') : t('referencia', 'reference')}</span> · {PARTS.find((p) => p.id === examinedPart)?.label[lang]}
              </div>
              <button onClick={() => { stopStream(); setLiveSide(null); }} className="btn-ghost text-sm">{t('Cancelar', 'Cancel')}</button>
            </div>
            <video ref={videoRef} playsInline muted className="w-full rounded-xl border border-soft bg-black aspect-video object-contain" />
            <div className="flex justify-center">
              <button onClick={snapPhoto} className="btn-primary px-8 py-3">{t('Hacer foto', 'Take photo')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Metal-mismatch warning — bottom sheet on mobile, centered modal on desktop */}
      {showMetalWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 fade-in" role="dialog" aria-modal="true">
          <div className="w-full sm:max-w-md card p-0 border-l-4 flex flex-col max-h-[85dvh] rounded-b-none rounded-t-2xl sm:rounded-xl" style={{ borderLeftColor: '#ef4444' }}>
            <div className="flex items-start gap-3 p-5 pb-3 shrink-0">
                <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-red-300">{t('La composición del metal no coincide', 'Metal composition does not match')}</h3>
                  <p className="text-sm text-muted mt-1">
                    {t('Una o más partes medidas no coinciden con', 'One or more measured parts do not match')} {currentBrand.name}:
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-soft px-5 py-3 overflow-y-auto flex-1 min-h-0">
                {XRF_TARGETS
                  .map((tg) => ({ tg, r: liveXrfByTarget[tg.id] }))
                  .filter((x) => x.r?.verdict === 'likely-fake')
                  .map(({ tg, r }) => (
                    <div key={tg.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-red-300 shrink-0">{tg.label[lang]}</span>
                      <span className="text-xs text-muted font-mono text-right">{r!.materialName} · {r!.overallScore}/100</span>
                    </div>
                  ))}
                <p className="text-xs text-dim pt-1">{t('El desglose elemento por elemento está en la pantalla de veredicto.', 'Full element-by-element breakdown is on the verdict screen.')}</p>
              </div>

              <div className="p-5 pt-3 shrink-0 border-t border-soft" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                <p className="text-sm text-foreground mb-3">{t('¿Quieres continuar con la autenticación de todos modos?', 'Do you want to continue with the authentication anyway?')}</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowMetalWarning(false)} className="btn-ghost text-sm">
                    {t('Parar aquí', 'Stop here')}
                  </button>
                  <button
                    onClick={() => { setShowMetalWarning(false); advance(); }}
                    className="btn-primary text-sm"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)' }}
                  >
                    {t('Continuar igualmente', 'Continue anyway')}
                  </button>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

function StepHeader({ step, statuses, onJump }: { step: Step; statuses: StepStatus[]; onJump: (s: Step) => void }) {
  const { t, lang } = useLang();
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
                key={label.en}
                onClick={() => onJump(i as Step)}
                aria-label={`${label[lang]} — ${STATUS_STYLE[st].label[lang]}`}
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
            <span className="text-xs text-dim">{t('Paso', 'Step')} {step + 1} {t('de', 'of')} {STEP_LABELS.length}</span>
            <div className="text-accent-bright font-semibold">{STEP_LABELS[step]![lang]}</div>
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
              key={label.en}
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
                {label[lang]}
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
  const { t } = useLang();
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-dim">{title}</div>
      <div className="aspect-square rounded-xl bg-black/40 border border-soft border-dashed flex items-center justify-center overflow-hidden">
        {dataUrl ? (
          <img src={dataUrl} alt={title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-dim text-xs">{t('aún sin foto', 'no photo yet')}</div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onCamera} className="btn-primary text-xs flex-1 min-w-[7rem]">{dataUrl ? t('Repetir', 'Retake') : t('Abrir cámara', 'Open camera')}</button>
        <button onClick={onUpload} className="btn-ghost text-xs flex-1 min-w-[5rem]">{t('Subir', 'Upload')}</button>
        {dataUrl && <button onClick={onReset} className="btn-ghost text-xs">{t('Borrar', 'Reset')}</button>}
      </div>
    </div>
  );
}

function PhotoView({ title, dataUrl }: { title: string; dataUrl: string | null }) {
  const { t } = useLang();
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-dim mb-1">{title}</div>
      <div className="aspect-square rounded-lg bg-black/40 border border-soft flex items-center justify-center overflow-hidden">
        {dataUrl
          ? <img src={dataUrl} alt={title} className="w-full h-full object-contain" />
          : <div className="text-dim text-xs">{t('no aportada', 'not provided')}</div>}
      </div>
    </div>
  );
}
