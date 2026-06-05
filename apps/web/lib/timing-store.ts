// Shares the latest chronocomparator (timegrapher) reading with the
// authentication report. Stored locally so the report can include it.

export type TimingReading = {
  rate: number;
  beatError: number | null;
  detectedBph: number;
  expectedBph: number;
  at: number; // epoch ms
};

const KEY = 'timegrapher-last-reading';

export function saveTimingReading(r: TimingReading): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* noop */ }
}

export function getTimingReading(): TimingReading | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<TimingReading>;
    if (typeof p.rate !== 'number' || typeof p.detectedBph !== 'number') return null;
    return {
      rate: p.rate,
      beatError: typeof p.beatError === 'number' ? p.beatError : null,
      detectedBph: p.detectedBph,
      expectedBph: typeof p.expectedBph === 'number' ? p.expectedBph : 0,
      at: typeof p.at === 'number' ? p.at : 0,
    };
  } catch {
    return null;
  }
}

export function clearTimingReading(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
