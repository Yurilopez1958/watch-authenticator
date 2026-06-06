// AudioWorklet onset/novelty streamer for the acoustic chronocomparator.
//
// Runs on the dedicated audio thread. A Swiss lever escapement makes a short
// burst of sharp clicks per beat (the ~3 audible noises: unlocking, exit-stone
// release, entry-stone drop). Those clicks are TRANSIENTS that stand out from
// stationary room noise. So instead of the raw envelope (where steady noise
// rises just like a tick), we stream an ONSET / NOVELTY signal:
//   novelty = max(0, fastEnvelope - slowAverage)
// decimated by MAX (peak-preserving) to ~ENV_HZ. The page autocorrelates that
// to find the beat period. Also reports a raw peak for the level meter.
//
// Messages IN:  { type:'config', gain? } | { type:'reset' }
// Messages OUT: { type:'env', env:number[], peak:number, envHz:number }

const ENV_HZ = 4000;        // decimated output rate
const FLUSH_SECONDS = 0.05; // ~20 posts/second

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
    this.env = 0;     // fast envelope (tracks clicks)
    this.slow = 0;    // slow average (tracks the noise floor)
    this.peak = 0;    // raw peak since last flush (meter)
    this.decim = 0;   // decimation counter
    this.accMax = 0;  // running max novelty within a decimation window
    this.out = [];    // decimated novelty pending flush
    this.sinceFlush = 0;
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;

    const sr = sampleRate;
    const step = Math.max(1, Math.round(sr / ENV_HZ)); // e.g. 12
    const g = this.gain;
    let env = this.env, slow = this.slow, peak = this.peak, accMax = this.accMax, decim = this.decim;

    for (let i = 0; i < input.length; i++) {
      const a = Math.abs(input[i]) * g;
      env += a > env ? (a - env) * 0.4 : (a - env) * 0.08;  // fast attack, fast-ish release → sharp clicks
      slow += (env - slow) * 0.0004;                         // ~50 ms average → noise floor
      const nov = env > slow ? env - slow : 0;               // onset novelty
      if (env > peak) peak = env;
      if (nov > accMax) accMax = nov;
      if (++decim >= step) { this.out.push(accMax); accMax = 0; decim = 0; }
    }

    this.env = env; this.slow = slow; this.peak = peak; this.accMax = accMax; this.decim = decim;
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
