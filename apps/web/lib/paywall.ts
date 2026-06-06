'use client';

// Lightweight global paywall: server endpoints return a friendly bilingual
// payload with 402/429/403; handlePaywall() catches those and pops a sheet.

export type Bi = { es: string; en: string };
export type PaywallPayload = { title?: Bi; message?: Bi; cta?: string; error?: string };

export const PAYWALL_EVENT = 'show-paywall';

export function showPaywall(p: PaywallPayload): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PAYWALL_EVENT, { detail: p }));
  }
}

/**
 * If the response is a paywall status (402/429/403), reads its JSON payload,
 * shows the paywall sheet and returns true (caller should stop). Otherwise
 * returns false WITHOUT consuming the body, so the caller can read it.
 */
export async function handlePaywall(res: Response): Promise<boolean> {
  if (res.status !== 402 && res.status !== 429 && res.status !== 403) return false;
  let payload: PaywallPayload = {};
  try { payload = (await res.json()) as PaywallPayload; } catch { /* ignore */ }
  showPaywall(payload);
  return true;
}
