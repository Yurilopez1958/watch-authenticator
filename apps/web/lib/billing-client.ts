'use client';

import { getSupabase } from './supabase';
import { getDeviceId } from './device-id';

/** Current Supabase access token (or null when not signed in / not configured). */
async function accessToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

/** fetch() that attaches the Bearer token and the device id. */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Device-Id', getDeviceId());
  return fetch(path, { ...init, headers });
}

export type PlanId = 'free' | 'pro' | 'business';

export type BillingMe = {
  plan: PlanId;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: { auth: number | null; valuation: number | null; devices: number };
  used: { auth: number; valuation: number };
};

/** Loads the current plan + usage, or null if unavailable (not signed in / not configured). */
export async function getBillingMe(): Promise<BillingMe | null> {
  try {
    const res = await authedFetch('/api/billing/me');
    if (!res.ok) return null;
    return (await res.json()) as BillingMe;
  } catch { return null; }
}

/** Starts Stripe Checkout for a paid plan; returns the redirect URL or null. */
export async function startCheckout(plan: 'pro' | 'business'): Promise<string | null> {
  try {
    const res = await authedFetch('/api/billing/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }),
    });
    const j = await res.json().catch(() => null);
    return j?.url ?? null;
  } catch { return null; }
}

/** Opens the Stripe customer portal; returns the URL or null. */
export async function openPortal(): Promise<string | null> {
  try {
    const res = await authedFetch('/api/billing/portal', { method: 'POST' });
    const j = await res.json().catch(() => null);
    return j?.url ?? null;
  } catch { return null; }
}
