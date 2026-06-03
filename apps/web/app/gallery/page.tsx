'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_BRANDS,
  ALL_MODELS,
  ROLEX_AUTH_CHECKPOINTS,
  getMovementCheckpoints,
  getMovementForModelAcrossBrands,
} from '@watch-auth/core';
import {
  countByModel,
  deletePhoto,
  getPhotos,
  savePhoto,
  type RefPhoto,
} from '@/lib/photo-store';

type GalleryPart = { id: string; label: string; checkpointIds: string[] };

const GALLERY_PARTS: readonly GalleryPart[] = [
  { id: 'movement', label: 'Movement', checkpointIds: [] },
  { id: 'dial', label: 'Dial', checkpointIds: ['dial-printing', 'cyclops'] },
  { id: 'hands', label: 'Hands', checkpointIds: ['hands'] },
  { id: 'logo', label: 'Coronet / logo', checkpointIds: ['crown-logo'] },
  { id: 'crown', label: 'Winding crown', checkpointIds: ['crown-logo'] },
  { id: 'bezel', label: 'Bezel', checkpointIds: ['weight-feel'] },
  { id: 'case-back', label: 'Case back', checkpointIds: ['case-back'] },
  { id: 'serial-number', label: 'Serial / rehaut', checkpointIds: ['serial-engraving', 'rehaut'] },
  { id: 'bracelet-link', label: 'Bracelet', checkpointIds: ['bracelet-clasp'] },
  { id: 'clasp', label: 'Clasp', checkpointIds: ['bracelet-clasp'] },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

function checkpointPoints(part: GalleryPart, caliber: string): string[] {
  if (part.id === 'movement') return [...getMovementCheckpoints(caliber)];
  const pts: string[] = [];
  for (const id of part.checkpointIds) {
    const cp = ROLEX_AUTH_CHECKPOINTS.find((c) => c.id === id);
    if (cp) pts.push(...cp.points);
  }
  return pts;
}

export default function GalleryPage() {
  // Step 1: pick the reference watch (brand / model / year)
  const [started, setStarted] = useState(false);
  const [brandId, setBrandId] = useState<string>(ALL_BRANDS[0]!.id);
  const [modelSearch, setModelSearch] = useState('');
  const [modelId, setModelId] = useState<string>(ALL_MODELS[0]!.id);
  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);

  // Step 2: photos per part
  const [photosByPart, setPhotosByPart] = useState<Record<string, RefPhoto[]>>({});
  const [total, setTotal] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
  const groupedModels = useMemo(() => {
    const groups = new Map<string, typeof ALL_MODELS[number][]>();
    for (const m of filteredModels) {
      const arr = groups.get(m.collection) ?? [];
      arr.push(m);
      groups.set(m.collection, arr);
    }
    return Array.from(groups.entries());
  }, [filteredModels]);

  useEffect(() => {
    if (!filteredModels.some((m) => m.id === modelId) && filteredModels.length > 0) {
      setModelId(filteredModels[0]!.id);
    }
  }, [filteredModels, modelId]);

  const currentModel = ALL_MODELS.find((m) => m.id === modelId);
  const currentBrand = ALL_BRANDS.find((b) => b.id === brandId)!;
  const movement = useMemo(() => getMovementForModelAcrossBrands(modelId), [modelId]);
  const caliber = movement?.caliber ?? '';

  const productionYears = useMemo(() => {
    if (!currentModel) return [] as number[];
    const cur = new Date().getFullYear();
    const end = Math.min(currentModel.yearEnd ?? cur, cur);
    const years: number[] = [];
    for (let y = end; y >= currentModel.yearStart; y--) years.push(y);
    return years;
  }, [currentModel]);
  useEffect(() => {
    if (productionYears.length > 0 && !productionYears.includes(year)) setYear(productionYears[0]!);
  }, [productionYears, year]);

  const loadPhotos = async () => {
    const next: Record<string, RefPhoto[]> = {};
    for (const part of GALLERY_PARTS) {
      next[part.id] = await getPhotos(brandId, modelId, part.id);
    }
    setPhotosByPart(next);
    setTotal(await countByModel(brandId, modelId));
  };

  useEffect(() => {
    if (started) void loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, modelId]);

  const onUpload = (partId: string) => async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const photo: RefPhoto = {
      id: `${brandId}-${modelId}-${partId}-${Math.round(performance.now())}-${Math.floor(Math.random() * 1e6)}`,
      brandId,
      modelId,
      caliber,
      year,
      part: partId,
      dataUrl,
      createdAt: Date.now(),
    };
    await savePhoto(photo);
    await loadPhotos();
  };

  const onDelete = async (id: string) => {
    await deletePhoto(id);
    await loadPhotos();
  };

  // ---------- Intro / "Create your own gallery" ----------
  if (!started) {
    return (
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-bold mb-2">Reference gallery</h1>
          <p className="text-muted text-sm max-w-2xl">
            Build your own library of <span className="text-accent-bright">verified-authentic</span> reference
            photos. Pick a watch by model and year, then add photos of each part you check during
            authentication. Stored privately on this device.
          </p>
        </section>
        <section className="card p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-xl bg-accent-soft text-accent-bright flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Create your own gallery</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Choose the brand, model and year of an authentic watch, then photograph each part to use
            as your personal reference.
          </p>
          <button onClick={() => setStarted(true)} className="btn-primary">Create your own gallery</button>
        </section>
      </div>
    );
  }

  // ---------- Builder ----------
  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">Create your own gallery</h1>
          <p className="text-muted text-sm">Pick the reference watch, then add photos for each part.</p>
        </div>
        <button onClick={() => setStarted(false)} className="btn-ghost text-sm shrink-0">← Back</button>
      </section>

      {/* Reference watch picker */}
      <section className="card p-5 space-y-4">
        <div className="text-sm font-semibold">1. Reference watch</div>
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
            placeholder='e.g. "16234", "Submariner", "Nautilus"...'
          />
        </label>
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
              Year
              {currentModel && <span className="text-dim/70 normal-case ml-1">· {currentModel.yearStart}–{currentModel.yearEnd ?? 'present'}</span>}
            </span>
            {productionYears.length <= 18 ? (
              <div className="flex flex-wrap gap-2">
                {productionYears.map((y) => (
                  <button key={y} onClick={() => setYear(y)} className={`chip cursor-pointer ${year === y ? '!bg-accent !text-white !border-transparent' : ''}`}>{y}</button>
                ))}
              </div>
            ) : (
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="field">
                {productionYears.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            )}
          </div>
        </div>
        <div className="text-xs text-dim">
          {currentModel ? <>Selected: <span className="text-muted">{currentBrand.name} {currentModel.name} ({currentModel.reference})</span>{caliber && <> · Cal. {caliber}</>} · {total} photo(s) stored</> : 'Pick a model.'}
        </div>
      </section>

      {/* Parts to check */}
      <section className="space-y-4">
        <div className="text-sm font-semibold">2. Parts to check — add a reference photo for each</div>
        {GALLERY_PARTS.map((part) => {
          const photos = photosByPart[part.id] ?? [];
          const points = checkpointPoints(part, caliber);
          return (
            <div key={part.id} className="card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{part.label}</h3>
                  {photos.length > 0 && <span className="chip text-[0.65rem]">{photos.length}</span>}
                </div>
                <button onClick={() => fileRefs.current[part.id]?.click()} className="btn-primary text-sm inline-flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add photo
                </button>
                <input
                  ref={(el) => { fileRefs.current[part.id] = el; }}
                  type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(part.id)(f); e.target.value = ''; }}
                />
              </div>

              {points.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-muted mb-4">
                  {points.map((pt, i) => (
                    <li key={i} className="flex gap-2"><span className="text-accent-bright shrink-0">·</span><span>{pt}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-dim mb-4">Photograph this part on the authentic piece for reference.</p>
              )}

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative">
                      <img src={p.dataUrl} alt={part.label} className="w-full aspect-square object-cover rounded-lg border border-soft" />
                      <button onClick={() => void onDelete(p.id)} aria-label="Delete photo" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-red-300 flex items-center justify-center text-sm hover:bg-red-500/30">×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-dim border border-dashed border-soft rounded-lg py-6 text-center">
                  No reference photos yet for this part.
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
