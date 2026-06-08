import { getAdmin, getUserId } from '@/lib/server/clients';
import { PLANS, type PlanId } from '@/lib/plans';
import { ERRORS, errorResponse } from '@/lib/server/errors';

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw ERRORS.unauthorized();
    const admin = getAdmin();

    const { data: sub } = await admin.from('subscriptions')
      .select('plan, status, current_period_end, cancel_at_period_end').eq('user_id', userId).single();
    const plan = (sub?.plan ?? 'free') as PlanId;

    // Real admin role (from profiles.role) so staff can use paid features without
    // a subscription. Based on the DB role only — never on the client "pro" toggle.
    const { data: profile } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
    const isAdmin = profile?.role === 'admin';

    const period = new Date();
    period.setUTCDate(1); period.setUTCHours(0, 0, 0, 0);
    const { data: usage } = await admin.from('usage_counters')
      .select('auth_count, valuation_count')
      .eq('user_id', userId).eq('period_start', period.toISOString().slice(0, 10)).maybeSingle();
    const { data: credits } = await admin.from('credits').select('balance').eq('user_id', userId).maybeSingle();

    return Response.json({
      plan,
      isAdmin,
      status: sub?.status ?? 'active',
      currentPeriodEnd: sub?.current_period_end ?? null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      limits: { auth: PLANS[plan].authPerMonth, valuation: PLANS[plan].valuationsPerMonth, devices: PLANS[plan].devices },
      used: { auth: usage?.auth_count ?? 0, valuation: usage?.valuation_count ?? 0 },
      credits: credits?.balance ?? 0,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
