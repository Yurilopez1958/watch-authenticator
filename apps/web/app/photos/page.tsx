'use client';

import { useEffect, useRef, useState } from 'react';
import type { WatchPart } from '@watch-auth/core';
import { useLang } from '@/lib/i18n';

type Bi = { es: string; en: string };
type PartOption = { id: WatchPart; label: Bi };

const PARTS: readonly PartOption[] = [
  { id: 'movement', label: { es: 'Movimiento', en: 'Movement' } },
  { id: 'hands', label: { es: 'Agujas', en: 'Hands' } },
  { id: 'logo', label: { es: 'Logo / corona', en: 'Logo / crown' } },
  { id: 'dial', label: { es: 'Esfera', en: 'Dial' } },
  { id: 'serial-number', label: { es: 'Número de serie', en: 'Serial number' } },
  { id: 'case-back', label: { es: 'Fondo de caja', en: 'Case back' } },
  { id: 'case-side', label: { es: 'Canto de caja', en: 'Case side' } },
  { id: 'bezel', label: { es: 'Bisel', en: 'Bezel' } },
  { id: 'bracelet-link', label: { es: 'Brazalete', en: 'Bracelet' } },
  { id: 'clasp', label: { es: 'Cierre', en: 'Clasp' } },
];

type Side = 'examined' | 'reference';

export default function PhotosPage() {
  const { t, lang } = useLang();
  const [part, setPart] = useState<WatchPart>('movement');
  const [examined, setExamined] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [liveSide, setLiveSide] = useState<Side | null>(null);
  const [splitView, setSplitView] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const examinedFileRef = useRef<HTMLInputElement | null>(null);
  const referenceFileRef = useRef<HTMLInputElement | null>(null);

  const currentPart = PARTS.find((p) => p.id === part);
  const partLabel = currentPart?.label[lang] ?? '';

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopStream(), []);

  const openCamera = async (side: Side) => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setLiveSide(side);
      // Wait one tick for the video tag to render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 50);
    } catch (err) {
      alert(
        t(
          `Cámara no disponible: ${(err as Error).message}. Aún puedes subir una imagen con el botón "Subir".`,
          `Camera not available: ${(err as Error).message}. You can still upload an image with the "Upload" button.`,
        ),
      );
    }
  };

  const closeCamera = () => {
    stopStream();
    setLiveSide(null);
  };

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video || !liveSide) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (liveSide === 'examined') setExamined(dataUrl);
    else setReference(dataUrl);
    closeCamera();
  };

  const onFile = (side: Side) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const reset = (side: Side) => () => {
    if (side === 'examined') setExamined(null);
    else setReference(null);
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Captura y comparación de fotos', 'Photo capture & compare')}</h1>
        <p className="text-muted text-sm">
          {t(
            'Captura o sube una foto de la parte del reloj que quieres examinar y una foto de referencia de la misma parte en una pieza auténtica. Compáralas lado a lado o en vista dividida.',
            'Capture or upload a photo of the watch part you want to examine and a reference photo of the same part on an authentic piece. Compare them side-by-side or in split view.',
          )}
        </p>
      </section>

      <section>
        <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Parte del reloj', 'Watch part')}</div>
        <div className="flex flex-wrap gap-2">
          {PARTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPart(p.id)}
              className={`chip cursor-pointer transition-colors ${
                part === p.id ? '!bg-accent !text-white !border-transparent' : ''
              }`}
            >
              {p.label[lang]}
            </button>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-5">
        <PhotoPanel
          title={t('Reloj examinado', 'Examined watch')}
          tone="examined"
          dataUrl={examined}
          onCapture={() => openCamera('examined')}
          onUploadClick={() => examinedFileRef.current?.click()}
          onReset={reset('examined')}
        />
        <PhotoPanel
          title={t('Referencia auténtica', 'Authentic reference')}
          tone="reference"
          dataUrl={reference}
          onCapture={() => openCamera('reference')}
          onUploadClick={() => referenceFileRef.current?.click()}
          onReset={reset('reference')}
        />
        <input ref={examinedFileRef} type="file" accept="image/*" onChange={onFile('examined')} className="hidden" />
        <input ref={referenceFileRef} type="file" accept="image/*" onChange={onFile('reference')} className="hidden" />
      </section>

      {examined && reference && (
        <section className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-muted">
            {t('Comparando', 'Comparing the')} <span className="text-accent-bright font-semibold">{partLabel.toLowerCase()}</span>.
          </div>
          <button onClick={() => setSplitView(true)} className="btn-primary">
            {t('Abrir comparación dividida', 'Open split comparison')}
          </button>
        </section>
      )}

      {liveSide && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 fade-in">
          <div className="w-full max-w-3xl space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted">
                {t('Capturando para', 'Capturing for')}{' '}
                <span className="text-accent-bright font-semibold">
                  {liveSide === 'examined' ? t('reloj examinado', 'examined watch') : t('referencia auténtica', 'authentic reference')}
                </span> · {partLabel.toLowerCase()}
              </div>
              <button onClick={closeCamera} className="btn-ghost text-sm">{t('Cancelar', 'Cancel')}</button>
            </div>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full rounded-xl border border-soft bg-black aspect-video object-contain"
            />
            <div className="flex justify-center">
              <button onClick={snapPhoto} className="btn-primary px-8 py-3">
                <span className="inline-flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  {t('Tomar foto', 'Take photo')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {splitView && examined && reference && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col p-4 fade-in">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm text-muted">
              {t('Vista dividida', 'Split view')} · <span className="text-accent-bright">{partLabel}</span>
            </div>
            <button onClick={() => setSplitView(false)} className="btn-ghost text-sm">{t('Cerrar', 'Close')}</button>
          </div>
          <div className="flex-1 grid md:grid-cols-2 gap-3 min-h-0">
            <div className="relative bg-black rounded-xl overflow-hidden border border-soft">
              <img src={examined} alt={t('Examinado', 'Examined')} className="w-full h-full object-contain" />
              <div className="absolute top-2 left-2 chip">{t('Examinado', 'Examined')}</div>
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden border border-soft">
              <img src={reference} alt={t('Referencia', 'Reference')} className="w-full h-full object-contain" />
              <div className="absolute top-2 left-2 chip">{t('Referencia', 'Reference')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type PhotoPanelProps = {
  title: string;
  tone: Side;
  dataUrl: string | null;
  onCapture: () => void;
  onUploadClick: () => void;
  onReset: () => void;
};

function PhotoPanel({ title, tone, dataUrl, onCapture, onUploadClick, onReset }: PhotoPanelProps) {
  const { t } = useLang();
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
        <span className={`chip ${tone === 'examined' ? '' : '!bg-emerald-500/15 !text-emerald-300 !border-emerald-500/30'}`}>
          {tone === 'examined' ? t('examinado', 'examined') : t('referencia', 'reference')}
        </span>
      </div>

      <div className="relative rounded-xl bg-black/40 border border-soft border-dashed aspect-square flex items-center justify-center overflow-hidden">
        {dataUrl ? (
          <img src={dataUrl} alt={title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-dim text-sm px-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-2 text-accent-bright opacity-70">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {t('Aún no hay foto. Usa la cámara o sube una desde tu dispositivo.', 'No photo yet. Use the camera or upload from your device.')}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onCapture} className="btn-primary text-sm flex-1 min-w-[8rem]">
          <span className="inline-flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {dataUrl ? t('Volver a tomar', 'Retake with camera') : t('Abrir cámara', 'Open camera')}
          </span>
        </button>
        <button onClick={onUploadClick} className="btn-ghost text-sm flex-1 min-w-[6rem]">{t('Subir', 'Upload')}</button>
        {dataUrl && (
          <button onClick={onReset} className="btn-ghost text-sm">{t('Quitar', 'Reset')}</button>
        )}
      </div>
    </div>
  );
}
