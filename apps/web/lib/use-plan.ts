'use client';

import { useEffect, useState } from 'react';
import { getBillingMe, type PlanId } from './billing-client';
import { useSession } from './use-session';

export type PaidPlanState = {
  plan: PlanId;
  /** True for any paid plan (Pro or Business). */
  paid: boolean;
  /** True when the user's real role is admin (staff bypass). */
  isAdmin: boolean;
  /** Allowed to use paid features: a paid plan OR an admin. */
  entitled: boolean;
  /** Auth/billing is configured, so gating can apply at all. */
  enabled: boolean;
  /** Still resolving the session or the plan. */
  loading: boolean;
  /** The plan was successfully read from the server. */
  known: boolean;
};

/**
 * Resolves the signed-in user's billing plan for client-side feature gating.
 *
 * Mirrors the AuthGate philosophy: when auth/billing is NOT configured (e.g.
 * local dev, missing env) nothing is gated, so a misconfiguration can never lock
 * the app. Fail-open on transient errors too — server endpoints still enforce
 * limits on their own, so a brief client miss never leaks a paid action.
 */
export function usePaidPlan(): PaidPlanState {
  const { enabled, loading: sessionLoading, session } = useSession();
  const [plan, setPlan] = useState<PlanId>('free');
  const [isAdmin, setIsAdmin] = useState(false);
  const [known, setKnown] = useState(false);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) { setLoading(false); setKnown(false); return; }
    if (sessionLoading) { setLoading(true); return; }
    if (!session) { setLoading(false); setKnown(false); setPlan('free'); setIsAdmin(false); return; }
    setLoading(true);
    void getBillingMe().then((me) => {
      if (cancelled) return;
      if (me) { setPlan(me.plan); setIsAdmin(me.isAdmin); setKnown(true); }
      else { setPlan('free'); setIsAdmin(false); setKnown(false); }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [enabled, sessionLoading, session]);

  const paid = plan === 'pro' || plan === 'business';
  const entitled = paid || isAdmin;
  return { plan, paid, isAdmin, entitled, enabled, loading, known };
}
