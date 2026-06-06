// AudioWorklet beat detector for the acoustic chronocomparator.
//
// Runs on the dedicated audio rendering thread (not the main/UI thread), so the
// tick detection is sample-accurate and never stalls when the page is busy —
// unlike the deprecated ScriptProcessorNode it replaces. It performs envelope
// following + adaptive-threshold peak picking and posts detected beat times
// (in seconds) plus the recent peak level back to the page ~10×/second.
//
// Messages IN  (port.postMessage):
//   { type: 'config', gain?, sensitivity?, bph? }   live tuning
//   { type: 'reset' }                                clear detector state
// Messages OUT (port.onmessage):
//   { type: 'beats', beats: number[], peak: number, t: number }

const FLUSH_SECONDS = 0.1; // post detected beats ~every 100 ms

class TimegrapherProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.reset();
    this.gain = 8;
    this.sensitivity = 6;
    this.bph = 28800;
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (d.type === 'config') {
        if (Number.isFinite(d.gain)) this.gain = d.gain;
        if (Number.isFinite(d.sensitivity)) this.sensitivity = d.sensitivity;
        if (Number.isFinite(d.bph) && d.bph > 0) this.bph = d.bph;
      } else if (d.type === 'reset') {
        this.reset();
      }
    };
  }

  reset() {
    this.env = 0;          // envelope follower
    this.nf = 0;           // slow noise floor
    this.above = false;    // currently above threshold
    this.lastBeat = -1e9;  // sample index of last accepted beat
    this.gi = 0;           // global sample counter
    this.peak = 0;         // peak envelope since last flush
    this.beats = [];       // beat times (s) pending flush
    this.sinceFlush = 0;   // samples since last flush
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true; // keep the node alive even with no input yet

    const sr = sampleRate; // AudioWorkletGlobalScope global
    const nominalPeriod = 3600 / this.bph;       // seconds per beat
    const refractory = nominalPeriod * 0.45 * sr; // min samples between beats
    const g = this.gain;
    const mult = 12 - this.sensitivity;           // higher sensitivity → lower threshold

    let env = this.env, nf = this.nf, above = this.above;
    let last = this.lastBeat, gi = this.gi, peak = this.peak;
    const beats = this.beats;

    for (let i = 0; i < input.length; i++) {
      const a = Math.abs(input[i]) * g;                     // apply gain
      env += a > env ? (a - env) * 0.4 : (a - env) * 0.005; // attack fast, release slow
      if (env > peak) peak = env;
      nf += (env - nf) * 0.0003;                            // slow noise floor
      const thr = Math.max(nf * mult, 0.0008);
      if (!above && env > thr && gi - last > refractory) {
        beats.push(gi / sr);
        last = gi;
        above = true;
      } else if (above && env < thr * 0.5) {
        above = false;
      }
      gi++;
    }

    this.env = env; this.nf = nf; this.above = above;
    this.lastBeat = last; this.gi = gi; this.peak = peak;

    this.sinceFlush += input.length;
    if (this.sinceFlush >= sr * FLUSH_SECONDS) {
      this.sinceFlush = 0;
      this.port.postMessage({ type: 'beats', beats: beats.slice(), peak, t: gi / sr });
      this.beats = [];
      this.peak = 0; // each window reports its own recent peak
    }
    return true; // stay alive
  }
}

registerProcessor('timegrapher-processor', TimegrapherProcessor);
