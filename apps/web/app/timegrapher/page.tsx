'use client';

import { useEffect, useRef, useState } from 'react';
import { ALL_MODELS, getMovementForModelAcrossBrands } from '@watch-auth/core';

type Metrics = { rate: number; beatError: number | null; detectedBph: number; beats: number };
type TracePoint = { ms: number; even: boolean };

const BPH_PRESETS = [18000, 19800, 21600, 25200, 28800, 36000];

export default function TimegrapherPage() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expectedBph, setExpectedBph] = useState(28800);
  const [sensitivity, setSensitivity] = useState(5);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [modelId, setModelId] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');

  // Audio graph + detection state (refs so the audio callback stays stable)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sinkRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const beatsRef = useRef<number[]>([]); // beat timestamps in seconds
  const sampleIdxRef = useRef(0);
  const envRef = useRef(0);
  const noiseFloorRef = useRef(0);
  const aboveRef = useRef(false);
  const lastBeatSampleRef = useRef(-1e9);
  const bphRef = useRef(expectedBph);
  const sensRef = useRef(sensitivity);

  useEffect(() => { bphRef.current = expectedBph; }, [expectedBph]);
  useEffect(() => { sensRef.current = sensitivity; }, [sensitivity]);

  const stop = () => {
    try { processorRef.current?.disconnect(); } catch { /* noop */ }
    try { sourceRef.current?.disconnect(); } catch { /* noop */ }
    try { sinkRef.current?.disconnect(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { void audioCtxRef.current?.close(); } catch { /* noop */ }
    processorRef.current = null; sourceRef.current = null; sinkRef.current = null;
    streamRef.current = null; audioCtxRef.current = null;
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  const loadDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === 'audioinput'));
    } catch { /* noop */ }
  };

  // Request permission once so device labels become available, then list inputs.
  const detectMics = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      await loadDevices();
    } catch (err) {
      const e = err as Error;
      setError(e.name === 'NotAllowedError' ? 'Microphone permission denied.' : `Mic error: ${e.message}`);
    }
  };

  // Refresh the device list when a mic is plugged in / removed.
  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const handler = () => { void loadDevices(); };
    md.addEventListener('devicechange', handler);
    return () => md.removeEventListener('devicechange', handler);
  }, []);

  const onPickDevice = (id: string) => {
    setDeviceId(id);
    if (running) { stop(); window.setTimeout(() => void start(id), 200); }
  };

  const start = async (forceDeviceId?: string) => {
    setError(null);
    setMetrics(null);
    try {
      const useId = forceDeviceId !== undefined ? forceDeviceId : deviceId;
      const audio: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        ...(useId ? { deviceId: { exact: useId } } : {}),
      };
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
      streamRef.current = stream;
      void loadDevices(); // labels are available now that we have permission
      const Ctx = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) throw new Error('Web Audio not supported in this browser.');
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(2048, 1, 1);

      // reset detection state
      sampleIdxRef.current = 0;
      beatsRef.current = [];
      envRef.current = 0; noiseFloorRef.current = 0; aboveRef.current = false;
      lastBeatSampleRef.current = -1e9;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const sr = ctx.sampleRate;
        const nominalPeriod = 3600 / bphRef.current; // sec per beat
        const refractory = nominalPeriod * 0.45 * sr; // samples between beats
        const mult = sensRef.current;
        let env = envRef.current, nf = noiseFloorRef.current, above = aboveRef.current;
        let last = lastBeatSampleRef.current, gi = sampleIdxRef.current;
        const beats = beatsRef.current;
        for (let i = 0; i < input.length; i++) {
          const a = Math.abs(input[i]!);
          env += a > env ? (a - env) * 0.4 : (a - env) * 0.005; // envelope follower
          nf += (env - nf) * 0.0003;                            // slow noise floor
          const thr = Math.max(nf * mult, 0.004);
          if (!above && env > thr && gi - last > refractory) {
            beats.push(gi / sr);
            last = gi;
            above = true;
          } else if (above && env < thr * 0.5) {
            above = false;
          }
          gi++;
        }
        envRef.current = env; noiseFloorRef.current = nf; aboveRef.current = above;
        lastBeatSampleRef.current = last; sampleIdxRef.current = gi;
        const cutoff = gi / sr - 40; // keep last 40s of beats
        while (beats.length && beats[0]! < cutoff) beats.shift();
      };

      const sink = ctx.createGain();
      sink.gain.value = 0; // silent — avoid feedback
      source.connect(processor); processor.connect(sink); sink.connect(ctx.destination);
      sourceRef.current = source; processorRef.current = processor; sinkRef.current = sink;
      setRunning(true);
    } catch (err) {
      const e = err as Error;
      setError(e.name === 'NotAllowedError'
        ? 'Microphone permission denied. Allow it in your browser and try again.'
        : `Microphone error: ${e.message}`);
      stop();
    }
  };

  // Metrics + trace loop
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const beats = beatsRef.current;
      if (beats.length < 12) { setMetrics(null); return; }
      const nominalPeriod = 3600 / expectedBph;
      const t0 = beats[0]!;
      const pts: { x: number; t: number }[] = [];
      let lastIdx = -1;
      for (const t of beats) {
        const idx = Math.round((t - t0) / nominalPeriod);
        if (idx === lastIdx) continue; // drop double-detections
        pts.push({ x: idx, t });
        lastIdx = idx;
      }
      if (pts.length < 12) { setMetrics(null); return; }

      // Linear regression t = a + b*x  → b = measured beat period
      const n = pts.length;
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (const p of pts) { sx += p.x; sy += p.t; sxx += p.x * p.x; sxy += p.x * p.t; }
      const denom = n * sxx - sx * sx;
      if (denom === 0) { setMetrics(null); return; }
      const b = (n * sxy - sx * sy) / denom;
      if (!Number.isFinite(b) || b <= 0) { setMetrics(null); return; }

      const rate = 86400 * (nominalPeriod / b - 1);
      const detectedBph = 3600 / b;

      // Beat error: alternate consecutive intervals by index parity
      let evenSum = 0, evenN = 0, oddSum = 0, oddN = 0;
      for (let i = 1; i < pts.length; i++) {
        if (pts[i]!.x - pts[i - 1]!.x === 1) {
          const d = pts[i]!.t - pts[i - 1]!.t;
          if (pts[i - 1]!.x % 2 === 0) { evenSum += d; evenN++; } else { oddSum += d; oddN++; }
        }
      }
      const beatError = evenN && oddN ? Math.abs(evenSum / evenN - oddSum / oddN) / 2 * 1000 : null;

      const trace: TracePoint[] = pts.slice(-220).map((p) => {
        let res = (p.t - t0) - p.x * nominalPeriod;        // drift incl. rate (sec)
        res = res - Math.round(res / nominalPeriod) * nominalPeriod; // wrap to one period
        return { ms: res * 1000, even: p.x % 2 === 0 };
      });

      setMetrics({ rate, beatError, detectedBph, beats: beats.length });
      drawTrace(trace, nominalPeriod);
    }, 250);
    return () => window.clearInterval(id);
  }, [running, expectedBph]);

  const drawTrace = (trace: TracePoint[], nominalPeriod: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width, H = cv.height;
    ctx.fillStyle = '#0a1635';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(96,165,250,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    const halfMs = (nominalPeriod / 2) * 1000;
    const n = trace.length;
    for (let i = 0; i < n; i++) {
      const p = trace[i]!;
      const x = (i / Math.max(1, n - 1)) * W;
      let y = H / 2 - (p.ms / halfMs) * (H / 2);
      y = ((y % H) + H) % H; // wrap vertically like a timegrapher tape
      ctx.fillStyle = p.even ? '#60a5fa' : '#bfdbfe';
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  };

  const onPickModel = (id: string) => {
    setModelId(id);
    if (!id) return;
    const mv = getMovementForModelAcrossBrands(id);
    if (mv?.vph) setExpectedBph(mv.vph);
  };

  const bphMismatch = metrics && Math.abs(metrics.detectedBph - expectedBph) > expectedBph * 0.06;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">Acoustic chronocomparator</h1>
        <p className="text-muted text-sm max-w-2xl">
          Time a mechanical watch through a microphone. For best results plug a{' '}
          <span className="text-accent-bright">watch contact microphone</span> into the phone and select it below;
          the built-in mic works in a pinch (hold it to the case back in a quiet room). Measures rate (s/day),
          beat error and the detected frequency.
        </p>
      </section>

      {/* Trace + readout (blue) */}
      <section className="rounded-2xl p-5 border border-blue-500/30" style={{ background: 'linear-gradient(160deg,#0b1b44,#0a1024)' }}>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <Readout label="Rate" value={metrics ? `${metrics.rate >= 0 ? '+' : ''}${metrics.rate.toFixed(1)}` : '—'} unit="s/day" big />
          <Readout label="Beat error" value={metrics?.beatError != null ? metrics.beatError.toFixed(1) : '—'} unit="ms" />
          <Readout label="Detected" value={metrics ? Math.round(metrics.detectedBph).toString() : '—'} unit="bph" />
        </div>
        <canvas ref={canvasRef} width={640} height={200} className="w-full rounded-lg border border-blue-500/20" />
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="text-xs text-blue-200/70">
            {running
              ? metrics ? `Listening · ${metrics.beats} beats analysed` : 'Listening · move the mic closer to the watch…'
              : 'Idle — press Start and hold the phone against the case back.'}
          </div>
          {bphMismatch && (
            <div className="text-xs text-amber-300">⚠ Detected rate is far from the set frequency — pick the correct bph below.</div>
          )}
        </div>
      </section>

      {/* Controls */}
      <section className="card p-5 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          {!running ? (
            <button onClick={() => void start()} className="btn-primary inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              Start listening
            </button>
          ) : (
            <button onClick={stop} className="btn-ghost inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              Stop
            </button>
          )}
          {running && <span className="text-xs text-emerald-300 inline-flex items-center gap-1">● mic active</span>}
        </div>

        {error && <div className="text-sm text-red-300 border-l-4 border-l-red-500 bg-red-500/10 rounded-lg p-3">{error}</div>}

        <div>
          <div className="text-xs uppercase tracking-wide text-dim mb-2">Microphone input</div>
          {devices.length > 0 ? (
            <select value={deviceId} onChange={(e) => onPickDevice(e.target.value)} className="field">
              <option value="">System default microphone</option>
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</option>
              ))}
            </select>
          ) : (
            <button onClick={() => void detectMics()} className="btn-ghost text-sm">Detect microphones</button>
          )}
          <p className="text-xs text-dim mt-1.5">
            Plug your <span className="text-accent-bright">watch contact microphone</span> (timing pickup) into the
            phone — via a 3.5&nbsp;mm adapter or a USB-C audio interface — then select it here for a clean escapement
            signal, like a professional timing machine.
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-dim mb-2">Beat frequency (bph)</div>
          <div className="flex flex-wrap gap-2">
            {BPH_PRESETS.map((b) => (
              <button
                key={b}
                onClick={() => setExpectedBph(b)}
                className={`chip cursor-pointer ${expectedBph === b ? '!bg-accent !text-white !border-transparent' : ''}`}
              >
                {b} <span className="text-[0.65rem] opacity-70">({(b / 7200).toFixed(1)} Hz)</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-2">…or match a model (sets the caliber&apos;s frequency)</span>
            <select value={modelId} onChange={(e) => onPickModel(e.target.value)} className="field">
              <option value="">— pick a model —</option>
              {ALL_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.reference}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-2">Mic sensitivity ({sensitivity.toFixed(0)})</span>
            <input type="range" min={2} max={12} step={1} value={sensitivity} onChange={(e) => setSensitivity(parseInt(e.target.value, 10))} className="w-full" />
            <span className="block text-xs text-dim mt-1">Lower if it counts noise; higher if it misses beats.</span>
          </label>
        </div>
      </section>

      <section className="card p-5 text-xs text-muted space-y-2 border-l-4 border-l-accent">
        <div className="font-semibold text-neutral-200">Tips & honest limits</div>
        <p className="leading-relaxed">
          A <strong>watch contact microphone</strong> (timing pickup clamped to the movement) gives by far the cleanest
          signal — select it under &ldquo;Microphone input&rdquo;. The phone&apos;s built-in mic also works in a quiet
          room with the case back pressed to it, just less precisely (it picks up through the air).
          <strong> Rate</strong> and <strong>beat error</strong> stabilise after ~15–30&nbsp;seconds. The detected
          frequency must match the watch — pick the right bph (or a model) above. <strong>Amplitude</strong> is not
          measured yet (it needs the lift-angle plus clean intra-beat sound timing from a contact sensor).
        </p>
      </section>
    </div>
  );
}

function Readout({ label, value, unit, big }: { label: string; value: string; unit: string; big?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[0.7rem] uppercase tracking-wide text-blue-200/60">{label}</div>
      <div className={`font-mono font-bold text-blue-50 ${big ? 'text-4xl' : 'text-2xl'}`}>{value}</div>
      <div className="text-[0.7rem] text-blue-200/60">{unit}</div>
    </div>
  );
}
