// SaaS plan configuration. Limits are examples — adjust freely.
// null limit = unlimited.

export type PlanId = 'free' | 'pro' | 'business';

export type Plan = {
  label: string;
  authPerMonth: number | null;
  valuationsPerMonth: number | null;
  devices: number;
  /** Stripe price id (from env); null for the free plan. */
  stripePriceId: string | null;
};

export const PLANS: Record<PlanId, Plan> = {
  free:     { label: 'Free',     authPerMonth: 5,    valuationsPerMonth: 10,   devices: 1, stripePriceId: null },
  pro:      { label: 'Pro',      authPerMonth: 100,  valuationsPerMonth: 500,  devices: 2, stripePriceId: process.env.STRIPE_PRICE_PRO ?? null },
  business: { label: 'Business', authPerMonth: null, valuationsPerMonth: null, devices: 5, stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? null },
};

export const GRACE_DAYS = 3;

/** Whether the SaaS gating is switched on. When false, enforcement is skipped. */
export const SAAS_ENABLED = process.env.SAAS_ENABLED === 'true';

/** Resolves the plan id from a Stripe price id. */
export function planFromPriceId(priceId: string | null | undefined): PlanId {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId && priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business';
  return 'free';
}
