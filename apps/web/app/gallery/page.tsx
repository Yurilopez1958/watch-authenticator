'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ROLEX_BRAND,
  ROLEX_MOVEMENTS,
  ROLEX_AUTH_CHECKPOINTS,
  getMovementCheckpoints,
} from '@watch-auth/core';
import {
  countByCaliber,
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

// Calibers sorted newest-first
const CALIBERS = [...ROLEX_MOVEMENTS].sort((a, b) => b.yearStart - a.yearStart);

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
  const [caliber, setCaliber] = useState<string>(CALIBERS[0]!.caliber);
  const [photosByPart, setPhotosByPart] = useState<Record<string, RefPhoto[]>>({});
  const [total, setTotal] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentMovement = useMemo(
    () => ROLEX_MOVEMENTS.find((m) => m.caliber === caliber),
    [caliber],
  );

  const loadPhotos = async () => {
    const next: Record<string, RefPhoto[]> = {};
    for (const part of GALLERY_PARTS) {
      next[part.id] = await getPhotos(ROLEX_BRAND.id, caliber, part.id);
    }
    setPhotosByPart(next);
    setTotal(await countByCaliber(ROLEX_BRAND.id, caliber));
  };

  useEffect(() => {
    void loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caliber]);

  const onUpload = (partId: string) => async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const photo: RefPhoto = {
      id: `${ROLEX_BRAND.id}-${caliber}-${partId}-${Math.round(performance.now())}-${Math.floor(Math.random() * 1e6)}`,
      brandId: ROLEX_BRAND.id,
      caliber,
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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">Reference gallery</h1>
        <p className="text-muted text-sm">
          Build your own library of <span className="text-accent-bright">verified-authentic</span> reference
          photos, organised by caliber and part. Use them side-by-side with the watch you are examining.
          Photos are stored privately on this device.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip">{ROLEX_BRAND.name}</span>
          <label className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-dim">Caliber</span>
            <select value={caliber} onChange={(e) => setCaliber(e.target.value)} className="field !w-auto">
              {CALIBERS.map((m) => (
                <option key={m.id} value={m.caliber}>
                  Cal. {m.caliber} ({m.yearStart}–{m.yearEnd ?? 'present'})
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-dim">{total} photo(s) stored for this caliber</span>
        </div>
        {currentMovement?.notes && (
          <p className="text-xs text-muted leading-relaxed border-l-2 border-accent/40 pl-3">{currentMovement.notes}</p>
        )}
      </section>

      <section className="space-y-4">
        {GALLERY_PARTS.map((part) => {
          const photos = photosByPart[part.id] ?? [];
          const points = checkpointPoints(part, caliber);
          return (
            <div key={part.id} className="card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold">{part.label}</h2>
                <button
                  onClick={() => fileRefs.current[part.id]?.click()}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add photo
                </button>
                <input
                  ref={(el) => { fileRefs.current[part.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUpload(part.id)(f);
                    e.target.value = '';
                  }}
                />
              </div>

              {points.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-muted mb-4">
                  {points.map((pt, i) => (
                    <li key={i} className="flex gap-2"><span className="text-accent-bright shrink-0">·</span><span>{pt}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-dim mb-4">No specific guide for this part yet.</p>
              )}

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative group">
                      <img src={p.dataUrl} alt={part.label} className="w-full aspect-square object-cover rounded-lg border border-soft" />
                      <button
                        onClick={() => void onDelete(p.id)}
                        aria-label="Delete photo"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-red-300 flex items-center justify-center text-sm hover:bg-red-500/30"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-dim border border-dashed border-soft rounded-lg py-6 text-center">
                  No reference photos yet — add a photo of an authentic {caliber} {part.label.toLowerCase()}.
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
