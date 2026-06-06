// AudioWorklet envelope streamer for the acoustic chronocomparator.
//
// Runs on the dedicated audio thread. It rectifies + envelope-follows the mic
// signal and streams a DECIMATED envelope (~ENV_HZ samples/second) to the page,
// which finds the watch's beat period by AUTOCORRELATION — far more robust to
// room noise than peak-picking individual ticks. Also reports a peak level for
// the meter.
//
// Messages IN  (port.postMessage):
//   { type: 'config', gain? }     live gain tuning
//   { type: 'reset' }             clear state
// Messages OUT (port.onmessage):
//   { type: 'env', env: number[], peak: number, envHz: number }

const ENV_HZ = 4000;       // decimated envelope output rate
const FLUSH_SECONDS = 0.05; // post ~20x/second

class TimegrapherProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.gain = 6;
    this.reset();
    this.port.onmessage = (e) => {
      const d = e.data || {};
      if (d.type === 'config') {
        if (Number.isFinite(d.gain) && d.gain > 0) this.gain = d.gain;
      } else if (d.type === 'reset') {
        this.reset();
      }
    };
  }

  reset() {
    this.env = 0;          // envelope follower state
    this.peak = 0;         // peak since last flush (for the meter)
    this.decim = 0;        // sample counter for decimation
    this.acc = 0;          // envelope accumulator over a decimation window
    this.out = [];         // decimated envelope pending flush
    this.sinceFlush = 0;
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;

    const sr = sampleRate; // AudioWorkletGlobalScope global
    const step = Math.max(1, Math.round(sr / ENV_HZ)); // e.g. 48000/4000 = 12
    const g = this.gain;
    let env = this.env, peak = this.peak;

    for (let i = 0; i < input.length; i++) {
      const a = Math.abs(input[i]) * g;
      // Envelope follower: fast attack, moderate release → a clean spike per tick.
      env += a > env ? (a - env) * 0.35 : (a - env) * 0.02;
      if (env > peak) peak = env;
      this.acc += env;
      if (++this.decim >= step) {
        this.out.push(this.acc / step); // mean envelope across the window
        this.acc = 0;
        this.decim = 0;
      }
    }

    this.env = env;
    this.peak = peak;
    this.sinceFlush += input.length;
    if (this.sinceFlush >= sr * FLUSH_SECONDS) {
      this.sinceFlush = 0;
      this.port.postMessage({ type: 'env', env: this.out, peak, envHz: ENV_HZ });
      this.out = [];
      this.peak = 0;
    }
    return true;
  }
}

registerProcessor('timegrapher-processor', TimegrapherProcessor);
