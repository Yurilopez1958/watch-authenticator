// SaaS plan configuration. Limits are examples — adjust freely.
// null limit = unlimited.

export type PlanId = 'free' | 'pro' | 'business';

export type BillingInterval = 'month' | 'year';

export type Plan = {
  label: string;
  authPerMonth: number | null;
  valuationsPerMonth: number | null;
  devices: number;
  /** Stripe monthly price id (from env); null for the free plan. */
  stripePriceId: string | null;
  /** Stripe yearly price id (from env); null if not offered. */
  stripePriceIdYear: string | null;
};

export const PLANS: Record<PlanId, Plan> = {
  free:     { label: 'Free',     authPerMonth: 5,    valuationsPerMonth: 10,   devices: 1, stripePriceId: null, stripePriceIdYear: null },
  pro:      { label: 'Pro',      authPerMonth: 100,  valuationsPerMonth: 500,  devices: 2, stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,      stripePriceIdYear: process.env.STRIPE_PRICE_PRO_YEAR ?? null },
  business: { label: 'Business', authPerMonth: null, valuationsPerMonth: null, devices: 5, stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? null, stripePriceIdYear: process.env.STRIPE_PRICE_BUSINESS_YEAR ?? null },
};

/** Stripe price id of the one-time credit pack, and how many credits it grants. */
export const STRIPE_PRICE_CREDITS = process.env.STRIPE_PRICE_CREDITS ?? null;
export const CREDITS_PER_PACK = Number(process.env.CREDITS_PER_PACK ?? 50);

export const GRACE_DAYS = 3;

/** Whether the SaaS gating is switched on. When false, enforcement is skipped. */
export const SAAS_ENABLED = process.env.SAAS_ENABLED === 'true';

/** Picks the right price id for a plan + interval. */
export function priceIdFor(plan: PlanId, interval: BillingInterval): string | null {
  return interval === 'year' ? PLANS[plan].stripePriceIdYear : PLANS[plan].stripePriceId;
}

/** Resolves the plan id from a Stripe price id (monthly or yearly). */
export function planFromPriceId(priceId: string | null | undefined): PlanId {
  if (!priceId) return 'free';
  if (priceId === process.env.STRIPE_PRICE_PRO || priceId === process.env.STRIPE_PRICE_PRO_YEAR) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_BUSINESS || priceId === process.env.STRIPE_PRICE_BUSINESS_YEAR) return 'business';
  return 'free';
}
