'use client';

import { useEffect, useRef, useState } from 'react';
import { ALL_MODELS, getMovementForModelAcrossBrands } from '@watch-auth/core';
import { saveTimingReading } from '@/lib/timing-store';
import { useLang } from '@/lib/i18n';
import { usePro } from '@/lib/pro';

type Metrics = { rate: number; beatError: number | null; detectedBph: number; confidence: number; amplitude: number | null };

const BPH_PRESETS = [18000, 19800, 21600, 25200, 28800, 36000];

// Default balance lift angle (degrees) used to compute amplitude when the user
// does not enter one. 52° is the modern Swiss lever-escapement standard; many
// vintage / low-beat calibers are lower (38–48°), so the field can be edited.
const DEFAULT_LIFT_ANGLE = 52;

const ENV_HZ = 4000;            // envelope sample rate (must match the worklet)
const ENV_BUF_SECONDS = 8;      // analysis window
const ENV_BUF = ENV_HZ * ENV_BUF_SECONDS;

type Detection = { rate: number; detectedBph: number; beatError: number | null; confidence: number };

/**
 * Finds the watch's beat period in a window of the rectified envelope by
 * AUTOCORRELATION around the expected period, then refines the lag with
 * parabolic interpolation. Robust to room noise: it locks onto the dominant
 * periodicity instead of trusting individual peaks. Returns null until there is
 * enough data; `confidence` is the normalized correlation strength (0–1).
 */
function analyzeEnvelope(buf: Float64Array, envHz: number, bph: number): Detection | null {
  const N = buf.length;
  if (N < envHz * 2.5) return null; // need ≥ 2.5 s

  // Robust preprocessing so faint periodic ticks survive next to loud aperiodic
  // bumps (handling noise). Center-clip below mean+0.5σ to drop the low "grass",
  // then sqrt-compress so a big bump doesn't dominate the correlation energy.
  let mean = 0;
  for (let i = 0; i < N; i++) mean += buf[i]!;
  mean /= N;
  let varSum = 0;
  for (let i = 0; i < N; i++) { const d = buf[i]! - mean; varSum += d * d; }
  const std = Math.sqrt(varSum / N);
  const clip = mean + 0.5 * std;

  const x = new Float64Array(N);
  let xm = 0;
  for (let i = 0; i < N; i++) { const v = buf[i]! - clip; const c = v > 0 ? Math.sqrt(v) : 0; x[i] = c; xm += c; }
  xm /= N;
  let energy = 0;
  for (let i = 0; i < N; i++) { const v = x[i]! - xm; x[i] = v; energy += v * v; }
  if (energy <= 1e-9) return null; // essentially silence / no onsets

  const nominalPeriod = 3600 / bph;          // seconds per beat
  const P = nominalPeriod * envHz;           // samples per beat (approx)
  const minLag = Math.max(2, Math.floor(P * 0.8));
  const maxLag = Math.ceil(P * 1.2);
  if (maxLag >= N) return null;

  const ac: number[] = [];
  let best = -Infinity, bestLag = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    const lim = N - lag;
    for (let i = 0; i < lim; i++) s += x[i]! * x[i + lag]!;
    const norm = s / energy;
    ac.push(norm);
    if (norm > best) { best = norm; bestLag = lag; }
  }

  // Parabolic interpolation around the peak for sub-sample precision.
  const k = bestLag - minLag;
  let lagRefined = bestLag;
  if (k > 0 && k < ac.length - 1) {
    const y0 = ac[k - 1]!, y1 = ac[k]!, y2 = ac[k + 1]!;
    const denom = y0 - 2 * y1 + y2;
    if (denom !== 0) lagRefined = bestLag + (0.5 * (y0 - y2)) / denom;
  }

  const measuredPeriod = lagRefined / envHz; // seconds per beat
  if (measuredPeriod <= 0) return null;
  const rate = 86400 * (nominalPeriod / measuredPeriod - 1);
  const detectedBph = 3600 / measuredPeriod;
  const confidence = Math.max(0, Math.min(1, best));
  return { rate, detectedBph, beatError: null, confidence };
}

/**
 * Estimates balance-wheel amplitude (degrees) from the rectified envelope.
 *
 * The faint intra-beat escapement sounds (unlock → impulse → drop) are buried in
 * room noise on a single beat, so we PHASE-FOLD the envelope over the measured
 * beat period: averaging dozens of beats lifts the repeating sounds out of the
 * noise. After centring the loudest sound (the impulse), the unlock and drop show
 * up as the two side peaks. The balance crosses the lift angle θL between them,
 * and since θL ≪ amplitude the angular velocity there is ~constant, giving:
 *
 *     amplitude ≈ θL · T_beat / (π · Δt)          (Δt = unlock→drop interval)
 *
 * This is deliberately conservative: it returns null (→ the UI shows "—") unless
 * two clear side peaks are found and the result lands in a plausible mechanical
 * range. Showing nothing is better than a fabricated number in an auth tool.
 */
function estimateAmplitude(
  env: Float64Array,
  envHz: number,
  beatPeriodSec: number,
  liftAngleDeg: number,
): number | null {
  if (!(beatPeriodSec > 0) || !(liftAngleDeg > 0)) return null;
  const P = beatPeriodSec * envHz;            // samples per beat (fractional)
  const Pint = Math.round(P);
  if (!(Pint > 16)) return null;
  const beats = Math.floor((env.length - 1) / P);
  if (beats < 10) return null;                // need enough beats to average down

  // Phase-fold using the exact fractional period so phase doesn't drift/smear.
  const fold = new Float64Array(Pint);
  const cnt = new Float64Array(Pint);
  for (let k = 0; k < beats; k++) {
    const base = k * P;
    for (let j = 0; j < Pint; j++) {
      const idx = Math.round(base + j);
      if (idx >= 0 && idx < env.length) { fold[j]! += env[idx]!; cnt[j]!++; }
    }
  }
  for (let j = 0; j < Pint; j++) if (cnt[j]! > 0) fold[j]! /= cnt[j]!;

  // Roll the loudest sample (the impulse) to the centre of the array.
  let impIdx = 0, impVal = -Infinity;
  for (let j = 0; j < Pint; j++) if (fold[j]! > impVal) { impVal = fold[j]!; impIdx = j; }
  if (!(impVal > 0)) return null;
  const c = Math.floor(Pint / 2);
  const a = new Float64Array(Pint);
  for (let j = 0; j < Pint; j++) a[j] = fold[(impIdx - c + j + Pint * 2) % Pint]!;

  let sum = 0; for (let j = 0; j < Pint; j++) sum += a[j]!;
  const mean = sum / Pint;

  // Strongest local maximum on each side of the centred impulse.
  const guard = Math.max(3, Math.round(Pint * 0.02));
  const peakIn = (lo: number, hi: number): { idx: number; val: number } => {
    let bi = -1, bv = -Infinity;
    for (let j = lo; j <= hi; j++) {
      const v = a[j]!;
      if (v > bv && v >= a[j - 1]! && v >= a[j + 1]!) { bv = v; bi = j; }
    }
    return { idx: bi, val: bv };
  };
  const left = peakIn(1, c - guard);
  const right = peakIn(c + guard, Pint - 2);
  if (left.idx < 0 || right.idx < 0) return null;

  // Both side sounds must clearly rise out of the averaged noise floor.
  const qual = Math.max(mean * 1.6, impVal * 0.12);
  if (left.val < qual || right.val < qual) return null;

  const dt = (right.idx - left.idx) / envHz;  // unlock → drop interval (s)
  if (!(dt > 0)) return null;
  const amp = (liftAngleDeg * beatPeriodSec) / (Math.PI * dt);
  if (!isFinite(amp) || amp < 130 || amp > 330) return null; // plausible range
  return amp;
}

export default function TimegrapherPage() {
  const { t } = useLang();
  const { pro } = usePro();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expectedBph, setExpectedBph] = useState(28800);
  const [sensitivity, setSensitivity] = useState(6);
  const [gain, setGain] = useState(5);
  const [level, setLevel] = useState(0);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [modelId, setModelId] = useState<string>('');
  // Manual lift-angle override (empty string = use the default). Drives amplitude.
  const [liftAngleInput, setLiftAngleInput] = useState<string>('');
  // Official vph of the currently selected caliber/model (null = none selected).
  const [officialBph, setOfficialBph] = useState<number | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [compatMode, setCompatMode] = useState(false); // ScriptProcessor fallback engaged
  const [diag, setDiag] = useState<{ peak: number; secs: number; conf: number }>({ peak: 0, secs: 0, conf: 0 });

  // Audio graph + detection state (refs so the audio callback stays stable)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null); // legacy fallback
  const sinkRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Decimated-envelope ring buffer (the autocorrelation analysis window).
  const ringRef = useRef<{ data: Float32Array; head: number; count: number }>({
    data: new Float32Array(ENV_BUF), head: 0, count: 0,
  });
  // Legacy-fallback onset-follower + decimation state (mirrors the worklet).
  const fbEnvRef = useRef(0);
  const fbSlowRef = useRef(0);
  const fbDecimRef = useRef(0);
  const fbAccRef = useRef(0);
  const bphRef = useRef(expectedBph);
  const sensRef = useRef(sensitivity);
  const gainRef = useRef(gain);
  const levelRef = useRef(0);
  // Max raw envelope seen since start (NOT decayed). Used by the watchdog to tell
  // "silent input" (iOS worklet bug → fall back) from "quiet watch" (just low gain).
  const maxPeakRef = useRef(0);
  const forceFallbackRef = useRef(false); // once true, skip the worklet for the session
  const watchdogRef = useRef<number | null>(null);

  // Appends decimated envelope samples into the ring buffer.
  const pushEnv = (samples: ArrayLike<number>) => {
    const r = ringRef.current;
    for (let i = 0; i < samples.length; i++) {
      r.data[r.head] = samples[i]!;
      r.head = (r.head + 1) % ENV_BUF;
      if (r.count < ENV_BUF) r.count++;
    }
  };

  // Keep the refs (used by the legacy fallback) in sync AND live-tune the worklet.
  useEffect(() => { bphRef.current = expectedBph; }, [expectedBph]);
  useEffect(() => { sensRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { gainRef.current = gain; workletRef.current?.port.postMessage({ type: 'config', gain }); }, [gain]);

  const stop = () => {
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    try { workletRef.current?.port.close(); } catch { /* noop */ }
    try { workletRef.current?.disconnect(); } catch { /* noop */ }
    try { processorRef.current?.disconnect(); } catch { /* noop */ }
    try { sourceRef.current?.disconnect(); } catch { /* noop */ }
    try { sinkRef.current?.disconnect(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try { void audioCtxRef.current?.close(); } catch { /* noop */ }
    workletRef.current = null; processorRef.current = null;
    sourceRef.current = null; sinkRef.current = null;
    streamRef.current = null; audioCtxRef.current = null;
    setRunning(false);
  };

  useEffect(() => () => stop(), []);

  const loadDevices = async () => {
    try {
      const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
      setDevices(list);
      // If the remembered mic was unplugged (and we can see real ids), fall back to default.
      const real = list.filter((d) => d.deviceId);
      setDeviceId((cur) => (cur && real.length > 0 && !real.some((d) => d.deviceId === cur)) ? '' : cur);
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
      setError(e.name === 'NotAllowedError' ? t('Permiso de micrófono denegado.', 'Microphone permission denied.') : t(`Error de micro: ${e.message}`, `Mic error: ${e.message}`));
    }
  };

  // On mount: restore the saved mic choice and list inputs. Also refresh the list
  // whenever a mic is plugged in / removed (works on phone and PC).
  useEffect(() => {
    try { const saved = localStorage.getItem('tg-mic-device'); if (saved) setDeviceId(saved); } catch { /* noop */ }
    void loadDevices();
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const handler = () => { void loadDevices(); };
    md.addEventListener('devicechange', handler);
    return () => md.removeEventListener('devicechange', handler);
  }, []);

  const onPickDevice = (id: string) => {
    setDeviceId(id);
    try { if (id) localStorage.setItem('tg-mic-device', id); else localStorage.removeItem('tg-mic-device'); } catch { /* noop */ }
    if (running) { stop(); window.setTimeout(() => void start(id), 200); }
  };

  const saveForReport = () => {
    if (!metrics) return;
    saveTimingReading({
      rate: metrics.rate,
      beatError: metrics.beatError,
      detectedBph: metrics.detectedBph,
      expectedBph,
      at: Date.now(),
    });
    setSavedMsg(t('Guardado — aparecerá en el informe de autenticación del reloj.', 'Saved — it will appear in the watch authentication report.'));
  };

  const start = async (forceDeviceId?: string) => {
    setError(null);
    // Clear previous reading when a new one begins
    setMetrics(null);
    setLevel(0);
    levelRef.current = 0;
    maxPeakRef.current = 0;
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    setSavedMsg(null);
    drawWave();
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

      // reset the envelope ring buffer + fallback follower state
      ringRef.current.head = 0; ringRef.current.count = 0;
      fbEnvRef.current = 0; fbSlowRef.current = 0; fbDecimRef.current = 0; fbAccRef.current = 0;

      const sink = ctx.createGain();
      sink.gain.value = 0; // silent — avoid feedback

      // Drain decimated-envelope messages from the worklet into the ring buffer.
      const onEnv = (d: { env: number[]; peak: number }) => {
        if (d.peak > levelRef.current) levelRef.current = d.peak;
        if (d.peak > maxPeakRef.current) maxPeakRef.current = d.peak;
        if (d.env && d.env.length) pushEnv(d.env);
      };

      let usedWorklet = false;
      if (ctx.audioWorklet && !forceFallbackRef.current) {
        try {
          await ctx.audioWorklet.addModule('/worklets/timegrapher-processor.js');
          const node = new AudioWorkletNode(ctx, 'timegrapher-processor', {
            numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1,
          });
          node.port.postMessage({ type: 'config', gain: gainRef.current });
          node.port.onmessage = (e: MessageEvent) => {
            const d = e.data as { type?: string; env: number[]; peak: number };
            if (d?.type === 'env') onEnv(d);
          };
          source.connect(node); node.connect(sink);
          workletRef.current = node;
          usedWorklet = true;
        } catch {
          usedWorklet = false; // module failed to load → fall back below
        }
      }

      if (!usedWorklet) {
        // Legacy fallback: ScriptProcessorNode computes the same decimated envelope
        // on the main thread and feeds the same ring buffer.
        const processor = ctx.createScriptProcessor(2048, 1, 1);
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const sr = ctx.sampleRate;
          const step = Math.max(1, Math.round(sr / ENV_HZ));
          const g = gainRef.current;
          let env = fbEnvRef.current, slow = fbSlowRef.current, acc = fbAccRef.current, dc = fbDecimRef.current, peak = levelRef.current;
          const out: number[] = [];
          for (let i = 0; i < input.length; i++) {
            const a = Math.abs(input[i]!) * g;
            env += a > env ? (a - env) * 0.4 : (a - env) * 0.08; // fast envelope
            slow += (env - slow) * 0.0004;                        // noise-floor average
            const nov = env > slow ? env - slow : 0;              // onset novelty
            if (env > peak) peak = env;
            if (nov > acc) acc = nov;                             // decimate by MAX
            if (++dc >= step) { out.push(acc); acc = 0; dc = 0; }
          }
          fbEnvRef.current = env; fbSlowRef.current = slow; fbAccRef.current = acc; fbDecimRef.current = dc;
          levelRef.current = peak;
          if (peak > maxPeakRef.current) maxPeakRef.current = peak;
          if (out.length) pushEnv(out);
        };
        source.connect(processor); processor.connect(sink);
        processorRef.current = processor;
      }

      sink.connect(ctx.destination);
      sourceRef.current = source; sinkRef.current = sink;
      setRunning(true);

      // Watchdog: on iOS Safari a MediaStream → AudioWorklet path can deliver pure
      // silence (a known WebKit bug). If after 2.5s not a single sample of signal
      // arrived (not even room noise → maxPeak ≈ 0), the worklet mic is muted:
      // switch to the ScriptProcessor path, which receives audio reliably there.
      if (usedWorklet) {
        watchdogRef.current = window.setTimeout(() => {
          if (maxPeakRef.current < 1e-5) {
            forceFallbackRef.current = true;
            setCompatMode(true);
            stop();
            void start(useId);
          }
        }, 2500);
      }
    } catch (err) {
      const e = err as Error;
      setError(e.name === 'NotAllowedError'
        ? t('Permiso de micrófono denegado. Actívalo en tu navegador e inténtalo de nuevo.', 'Microphone permission denied. Allow it in your browser and try again.')
        : t(`Error de micrófono: ${e.message}`, `Microphone error: ${e.message}`));
      stop();
    }
  };

  // Metrics + trace loop
  // Reads the ring buffer into an oldest-first array (or null if too little data).
  const snapshotEnv = (): Float64Array | null => {
    const r = ringRef.current;
    if (r.count < ENV_HZ * 1.5) return null;
    const out = new Float64Array(r.count);
    const start = (r.head - r.count + ENV_BUF) % ENV_BUF;
    for (let i = 0; i < r.count; i++) out[i] = r.data[(start + i) % ENV_BUF]!;
    return out;
  };

  // Resolved lift angle: the user's manual value when valid, else the default.
  const liftNum = parseFloat(liftAngleInput);
  const liftAngle = liftAngleInput.trim() !== '' && isFinite(liftNum) && liftNum > 0
    ? liftNum
    : DEFAULT_LIFT_ANGLE;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const lv = levelRef.current;
      setLevel(Math.min(1, lv * 3));
      const r = ringRef.current;
      levelRef.current *= 0.6; // decay so the meter falls back

      const env = snapshotEnv();
      drawWave(env);
      const det = env ? analyzeEnvelope(env, ENV_HZ, expectedBph) : null;
      const conf = det ? Math.round(det.confidence * 100) : 0;
      setDiag({ peak: lv, secs: r.count / ENV_HZ, conf });

      // Sensitivity acts as the lock threshold: higher → locks on a weaker periodicity.
      const lockThreshold = Math.max(0.06, 0.34 - sensitivity * 0.025);
      if (!det || det.confidence < lockThreshold) { setMetrics(null); return; }

      // Amplitude is derived from the SAME envelope using the measured beat period
      // and the resolved lift angle. Null (→ "—") whenever the signal isn't clean.
      const amplitude = env
        ? estimateAmplitude(env, ENV_HZ, 3600 / det.detectedBph, liftAngle)
        : null;

      setMetrics({
        rate: det.rate,
        beatError: det.beatError,
        detectedBph: det.detectedBph,
        confidence: conf,
        amplitude,
      });
    }, 200);
    return () => window.clearInterval(id);
  }, [running, expectedBph, sensitivity, liftAngle]);

  // Draws the recent envelope as a waveform: regular spikes = a watch locked in;
  // random hash = just noise. Passing null/empty clears to the idle grid.
  const drawWave = (env?: Float64Array | null) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    const W = cv.clientWidth || 680;
    const H = cv.clientHeight || 260;
    const bw = Math.max(1, Math.round(W * dpr));
    const bh = Math.max(1, Math.round(H * dpr));
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#070d20';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(59,130,246,0.10)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W + 1; gx += W / 12) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy <= H + 1; gy += H / 4) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    if (!env || env.length === 0) return;
    // Show the most recent ~1.6 s so individual ticks are visible.
    const showN = Math.min(env.length, Math.round(ENV_HZ * 1.6));
    const startI = env.length - showN;
    let mx = 1e-9;
    for (let i = startI; i < env.length; i++) if (env[i]! > mx) mx = env[i]!;
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < showN; i++) {
      const v = env[startI + i]! / mx;             // 0..1
      const x = (i / (showN - 1)) * W;
      const y = H - v * (H * 0.92) - 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const onPickModel = (id: string) => {
    setModelId(id);
    if (!id) { setOfficialBph(null); return; }
    const mv = getMovementForModelAcrossBrands(id);
    if (mv?.vph) { setExpectedBph(mv.vph); setOfficialBph(mv.vph); }
  };

  const bphMismatch = metrics && Math.abs(metrics.detectedBph - expectedBph) > expectedBph * 0.06;
  // New (additive): when a caliber/model is selected, flag a measured frequency
  // that differs from that caliber's OFFICIAL vph by more than 2%. Informational
  // only — it never blocks the reading.
  const freqInconsistent = officialBph != null && metrics != null
    && Math.abs(metrics.detectedBph - officialBph) > officialBph * 0.02;
  const rateColor = metrics ? (Math.abs(metrics.rate) <= 10 ? '#34d399' : Math.abs(metrics.rate) <= 30 ? '#fbbf24' : '#f87171') : undefined;
  const beColor = metrics?.beatError != null ? (metrics.beatError <= 0.5 ? '#34d399' : metrics.beatError <= 1.0 ? '#fbbf24' : '#f87171') : undefined;
  const ampColor = metrics?.amplitude != null ? (metrics.amplitude >= 250 ? '#34d399' : metrics.amplitude >= 180 ? '#fbbf24' : '#f87171') : undefined;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Cronocomparador acústico', 'Acoustic chronocomparator')}</h1>
        <p className="text-muted text-sm max-w-2xl">
          {t('Mide la marcha de un reloj mecánico con el', 'Time a mechanical watch using your')} <span className="text-accent-bright">{t('micrófono del teléfono', "phone's microphone")}</span> — {t('sin hardware extra. Pulsa Empezar y apoya el micro del teléfono en la tapa trasera, en una sala en silencio. Mide marcha (s/día), error de batido y la frecuencia detectada.', 'no extra hardware needed. Press Start and hold the phone’s mic to the case back in a quiet room. Measures rate (s/day), beat error and the detected frequency.')}
        </p>
      </section>

      {/* Witschi-style timing instrument */}
      <section className="rounded-2xl overflow-hidden border border-blue-500/30 shadow-xl shadow-blue-950/40" style={{ background: '#0a1024' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-blue-500/15 border-b border-blue-500/15">
          <Cell label={t('Marcha', 'Rate')} value={metrics ? `${metrics.rate >= 0 ? '+' : ''}${metrics.rate.toFixed(1)}` : '—'} unit={t('s / día', 's / day')} color={rateColor} big />
          <Cell label={t('Amplitud', 'Amplitude')} value={metrics?.amplitude != null ? Math.round(metrics.amplitude).toString() : '—'} unit={t('grados', 'degrees')} color={ampColor} />
          <Cell label={t('Error de batido', 'Beat error')} value={metrics?.beatError != null ? metrics.beatError.toFixed(1) : '—'} unit="ms" color={beColor} />
          <Cell label={t('Frecuencia', 'Frequency')} value={metrics ? Math.round(metrics.detectedBph).toString() : '—'} unit="bph" />
        </div>
        <div className="px-4 py-2.5 border-b border-blue-500/15 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[0.6rem] uppercase tracking-widest text-blue-300/50 shrink-0">{t('Señal', 'Signal')}</span>
            <div className="flex-1 h-2.5 rounded-full bg-blue-950/70 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, level * 100)}%`, background: 'linear-gradient(90deg,#34d399,#fbbf24,#f87171)', transition: 'width 70ms linear' }}
              />
            </div>
            <span className="text-[0.65rem] font-mono tabular-nums text-blue-200/70 w-9 text-right shrink-0">{Math.round(level * 100)}%</span>
          </div>
          {running && pro && (
            <div className="text-[0.62rem] text-blue-300/45 font-mono">
              {t('nivel', 'level')} {diag.peak.toFixed(3)} · {t('enganche', 'lock')} {diag.conf}% · {t('buffer', 'buffer')} {diag.secs.toFixed(1)}s
              {diag.peak < 1e-4 && <span className="text-amber-300/80"> · {t('toca el teléfono junto al micro: la barra debe saltar', 'tap the phone near the mic: the bar should jump')}</span>}
            </div>
          )}
        </div>
        <canvas ref={canvasRef} width={680} height={260} className="w-full block" style={{ aspectRatio: '680 / 260' }} />
        <div className="flex items-center justify-between px-4 py-2 border-t border-blue-500/15 text-xs gap-2 flex-wrap">
          <span className="inline-flex items-center gap-2 text-blue-200/70">
            <span className={`w-2 h-2 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : 'bg-blue-500/40'}`} />
            {running
              ? (metrics
                  ? t(`Enganchado · señal ${metrics.confidence}%`, `Locked · signal ${metrics.confidence}%`)
                  : t('Escuchando… apoya el micro en el reloj', 'Listening… place the mic on the watch'))
              : t('En espera — pulsa Empezar', 'Idle — press Start')}
          </span>
          {compatMode && <span className="text-blue-300/60" title={t('Cambiado a modo compatible para captar el micro en este dispositivo.', 'Switched to compatibility mode to capture the mic on this device.')}>· {t('modo compatible', 'compatibility mode')}</span>}
          {bphMismatch && <span className="text-amber-300">⚠ {t('Detectado ≠ frecuencia fijada — elige la bph correcta abajo.', 'Detected ≠ set frequency — choose the correct bph below.')}</span>}
        </div>
      </section>

      {/* Frequency-consistency check vs the selected caliber's official vph.
          Informational only — does not block the reading. */}
      {freqInconsistent && (
        <div className="text-sm text-amber-200 border-l-4 border-l-amber-500 bg-amber-500/10 rounded-lg p-3">
          {t(
            '⚠️ Frecuencia inconsistente con el calibre seleccionado. Posible error de lectura o movimiento no original.',
            '⚠️ Frequency inconsistent with the selected caliber. Possible reading error or non-original movement.',
          )}
        </div>
      )}

      {/* Controls */}
      <section className="card p-5 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          {!running ? (
            <button onClick={() => void start()} className="btn-primary inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              {t('Empezar a escuchar', 'Start listening')}
            </button>
          ) : (
            <button onClick={stop} className="btn-ghost inline-flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              {t('Parar', 'Stop')}
            </button>
          )}
          {running && <span className="text-xs text-emerald-300 inline-flex items-center gap-1">● {t('micro activo', 'mic active')}</span>}
          {metrics && (
            <button onClick={saveForReport} className="btn-ghost text-sm inline-flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
              </svg>
              {t('Guardar lectura para el informe', 'Save reading for report')}
            </button>
          )}
        </div>

        {savedMsg && <div className="text-xs text-emerald-300 border-l-4 border-l-emerald-500 bg-emerald-500/10 rounded-lg p-3">{savedMsg}</div>}
        {error && <div className="text-sm text-red-300 border-l-4 border-l-red-500 bg-red-500/10 rounded-lg p-3">{error}</div>}

        {pro && <div>
          <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Entrada de micrófono', 'Microphone input')}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {devices.length > 0 && (
              <select value={deviceId} onChange={(e) => onPickDevice(e.target.value)} className="field max-w-xs">
                <option value="">{t('Micrófono predeterminado del sistema', 'System default microphone')}</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>{d.label || t(`Micrófono ${i + 1}`, `Microphone ${i + 1}`)}</option>
                ))}
              </select>
            )}
            <button onClick={() => void detectMics()} className="btn-ghost text-sm shrink-0">
              {devices.some((d) => d.label) ? t('Actualizar lista', 'Refresh list') : t('Detectar micrófonos', 'Detect microphones')}
            </button>
          </div>
          {deviceId && <p className="text-xs text-emerald-300 mt-1.5">✓ {t('Micrófono externo seleccionado (se recuerda para la próxima vez).', 'External microphone selected (remembered for next time).')}</p>}
          <p className="text-xs text-dim mt-1.5">
            {t(
              'Por defecto usa el micrófono interno — no hay que conectar nada. Avanzado: conecta un micrófono de contacto para reloj (por USB-C/jack/adaptador en el móvil, o USB/jack en el PC), pulsa "Detectar" y elígelo aquí para una señal más limpia.',
              'By default it uses the built-in microphone — nothing to plug in. Advanced: connect a watch contact microphone (via USB-C/jack/adapter on phone, or USB/jack on PC), press "Detect" and pick it here for a cleaner signal.',
            )}
          </p>
        </div>}

        <div>
          <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Frecuencia de batido (bph)', 'Beat frequency (bph)')}</div>
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

        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('…o elige un modelo (fija la frecuencia del calibre)', "…or match a model (sets the caliber's frequency)")}</span>
          <select value={modelId} onChange={(e) => onPickModel(e.target.value)} className="field">
            <option value="">{t('— elige un modelo —', '— pick a model —')}</option>
            {ALL_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.reference}</option>
            ))}
          </select>
        </label>

        {/* Manual lift angle → drives the amplitude estimate. Blank = default. */}
        <label className="block">
          <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Ángulo de alzada (lift angle) — para la amplitud', 'Lift angle — for amplitude')}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number"
              inputMode="decimal"
              min={20}
              max={90}
              step={1}
              value={liftAngleInput}
              onChange={(e) => setLiftAngleInput(e.target.value)}
              placeholder={`${DEFAULT_LIFT_ANGLE}`}
              className="field max-w-[7rem]"
              aria-label={t('Ángulo de alzada en grados', 'Lift angle in degrees')}
            />
            <span className="text-xs text-dim">{t(`grados — vacío usa ${DEFAULT_LIFT_ANGLE}° por defecto`, `degrees — blank uses ${DEFAULT_LIFT_ANGLE}° by default`)}</span>
          </div>
          <span className="block text-xs text-dim mt-1.5">
            {t(
              'Introduce el ángulo de alzada de tu calibre para una amplitud precisa. Típico 52° en relojes modernos; muchos calibres antiguos son menores (38–48°). Si lo dejas vacío se usa 52°.',
              "Enter your caliber's lift angle for an accurate amplitude. Typically 52° on modern watches; many vintage calibers are lower (38–48°). Left blank, 52° is used.",
            )}
          </span>
        </label>

        {pro && <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Nivel de micro / ganancia', 'Mic level / gain')} ({gain}×)</span>
            <input type="range" min={1} max={30} step={1} value={gain} onChange={(e) => setGain(parseInt(e.target.value, 10))} className="w-full" />
            <span className="block text-xs text-dim mt-1">{t('Súbelo si la onda casi no se mueve; bájalo si la barra Signal está siempre llena (saturada).', 'Raise it if the wave barely moves; lower it if the Signal bar is always full (saturated).')}</span>
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-2">{t('Sensibilidad de enganche', 'Lock sensitivity')} ({sensitivity})</span>
            <input type="range" min={1} max={10} step={1} value={sensitivity} onChange={(e) => setSensitivity(parseInt(e.target.value, 10))} className="w-full" />
            <span className="block text-xs text-dim mt-1">{t('Más alto = engancha con una señal más débil. Bájalo si da lecturas con ruido.', 'Higher = locks on a weaker signal. Lower it if it reads on noise.')}</span>
          </label>
        </div>}
      </section>

      <section className="card p-5 text-xs text-muted space-y-2 border-l-4 border-l-accent">
        <div className="font-semibold text-neutral-200">{t('Consejos y límites honestos', 'Tips & honest limits')}</div>
        <p className="leading-relaxed">
          {t(
            'El micrófono interno del teléfono funciona sin más — sala en silencio, tapa trasera apoyada en el micro. La marcha y el error de batido se estabilizan tras ~15–30 segundos. La frecuencia detectada debe coincidir con el reloj: elige la bph correcta (o un modelo) arriba. Opcionalmente, un micrófono de contacto sujeto al movimiento da una señal aún más limpia. La amplitud se estima a partir del ángulo de alzada y del timing del sonido dentro del beat; es una función nueva: solo aparece cuando la señal está muy limpia (mejor con micro de contacto) y conviene contrastarla con tu cronocomparador de referencia.',
            'The phone’s built-in microphone works out of the box — quiet room, case back pressed to the mic. Rate and beat error stabilise after ~15–30 seconds. The detected frequency must match the watch — pick the right bph (or a model) above. Optionally, a watch contact microphone clamped to the movement gives an even cleaner signal. Amplitude is estimated from the lift angle and the intra-beat sound timing; it’s a new feature — it only appears when the signal is very clean (best with a contact mic), so cross-check it against your reference timer.',
          )}
        </p>
      </section>
    </div>
  );
}

function Cell({ label, value, unit, color, big }: { label: string; value: string; unit: string; color?: string | undefined; big?: boolean | undefined }) {
  return (
    <div className="px-3 py-4 text-center">
      <div className="text-[0.6rem] uppercase tracking-[0.2em] text-blue-300/50">{label}</div>
      <div
        className={`font-mono font-bold tabular-nums leading-tight ${big ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}
        style={{ color: color ?? '#dbeafe' }}
      >
        {value}
      </div>
      <div className="text-[0.6rem] uppercase tracking-wider text-blue-300/40">{unit}</div>
    </div>
  );
}
