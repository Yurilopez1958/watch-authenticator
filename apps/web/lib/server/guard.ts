import { getAdmin, getUserId } from './clients';
import { PLANS, SAAS_ENABLED, type PlanId } from '@/lib/plans';
import { ERRORS, errorResponse } from './errors';

export type Ctx = { userId: string; plan: PlanId };

/**
 * Route helper: when SaaS is OFF returns null (proceed, no change in behaviour).
 * When ON: requires an active paid user, enforces the device limit and consumes
 * one unit of monthly quota. Returns a JSON error Response if blocked, else null.
 */
export async function checkUsage(req: Request, kind: 'auth' | 'valuation'): Promise<Response | null> {
  if (!SAAS_ENABLED) return null;
  try {
    const ctx = await requireActiveUser(req);
    await enforceDevice(ctx, req);
    await enforceQuota(ctx, kind);
    return null;
  } catch (e) {
    return errorResponse(e);
  }
}

/** Like checkUsage but only gates access (payment + device), no quota consumed. */
export async function checkAccess(req: Request): Promise<Response | null> {
  if (!SAAS_ENABLED) return null;
  try {
    const ctx = await requireActiveUser(req);
    await enforceDevice(ctx, req);
    return null;
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Requires a signed-in user whose account is not blocked and whose paid
 * subscription is current (or within the grace period). When SAAS_ENABLED is
 * false this still resolves the user but never blocks on payment.
 */
export async function requireActiveUser(req: Request): Promise<Ctx> {
  const userId = await getUserId(req);
  if (!userId) throw ERRORS.unauthorized();
  const admin = getAdmin();

  const { data: profile } = await admin.from('profiles').select('status').eq('id', userId).single();
  if (profile?.status === 'blocked') throw ERRORS.accountBlocked();

  const { data: sub } = await admin.from('subscriptions')
    .select('plan, status, grace_until').eq('user_id', userId).single();
  const plan = (sub?.plan ?? 'free') as PlanId;

  if (SAAS_ENABLED && plan !== 'free') {
    const ok = sub?.status === 'active' || sub?.status === 'trialing';
    const inGrace = sub?.grace_until ? new Date(sub.grace_until) > new Date() : false;
    if (!ok && !inGrace) throw ERRORS.paymentRequired();
  }
  return { userId, plan };
}

/** Atomically consumes one unit of monthly quota for the given action. */
export async function enforceQuota(ctx: Ctx, kind: 'auth' | 'valuation') {
  const limit = kind === 'auth' ? PLANS[ctx.plan].authPerMonth : PLANS[ctx.plan].valuationsPerMonth;
  if (!SAAS_ENABLED) return { used: 0, limit };
  const { data, error } = await getAdmin().rpc('consume_quota', {
    p_user: ctx.userId, p_kind: kind, p_limit: limit,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.allowed) throw ERRORS.limitReached(kind, limit ?? 0);
  return { used: row.used as number, limit };
}

/** Registers the device and enforces the plan's device limit (anti-sharing). */
export async function enforceDevice(ctx: Ctx, req: Request) {
  if (!SAAS_ENABLED) return;
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) return; // soft-degrade if the client didn't send one
  const admin = getAdmin();
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  const ua = req.headers.get('user-agent');

  await admin.from('devices').upsert(
    { user_id: ctx.userId, device_id: deviceId, last_ip: ip, user_agent: ua, last_seen: new Date().toISOString(), revoked: false },
    { onConflict: 'user_id,device_id' },
  );

  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: list } = await admin.from('devices')
    .select('device_id').eq('user_id', ctx.userId).eq('revoked', false).gte('last_seen', since);
  const distinct = new Set((list ?? []).map((d: { device_id: string }) => d.device_id));
  const allowed = PLANS[ctx.plan].devices;
  if (distinct.size > allowed) {
    await admin.from('security_events').insert({
      user_id: ctx.userId, type: 'new_device', severity: 2, ip, details: { distinct: distinct.size, allowed },
    });
    throw ERRORS.deviceLimit(allowed);
  }

  // Suspicious IP: many distinct IPs in a short window → flag for review.
  const win = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: recent } = await admin.from('devices')
    .select('last_ip').eq('user_id', ctx.userId).gte('last_seen', win);
  const ips = new Set((recent ?? []).map((d: { last_ip: string | null }) => d.last_ip).filter(Boolean));
  if (ips.size >= 4) {
    await admin.from('security_events').insert({
      user_id: ctx.userId, type: 'suspicious_ip', severity: 3, ip, details: { ips: [...ips] },
    });
    await admin.from('profiles').update({ status: 'review' }).eq('id', ctx.userId);
  }
}
