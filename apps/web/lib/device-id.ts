'use client';

const KEY = 'device-id';

/** Stable per-device id (for the anti-account-sharing device limit). */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
  }
  return id;
}
