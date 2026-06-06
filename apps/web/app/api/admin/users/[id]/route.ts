import { getAdmin } from '@/lib/server/clients';
import { requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse } from '@/lib/server/errors';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const admin = getAdmin();

    const [profile, sub, devices, security] = await Promise.all([
      admin.from('profiles').select('id, email, role, status, created_at').eq('id', id).single(),
      admin.from('subscriptions').select('plan, status, current_period_end, cancel_at_period_end, stripe_customer_id').eq('user_id', id).single(),
      admin.from('devices').select('device_id, last_ip, user_agent, last_seen, revoked').eq('user_id', id).order('last_seen', { ascending: false }).limit(20),
      admin.from('security_events').select('type, severity, ip, created_at, details').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
    ]);

    const period = new Date(); period.setUTCDate(1); period.setUTCHours(0, 0, 0, 0);
    const { data: usage } = await admin.from('usage_counters')
      .select('auth_count, valuation_count').eq('user_id', id).eq('period_start', period.toISOString().slice(0, 10)).maybeSingle();

    return Response.json({
      profile: profile.data,
      subscription: sub.data,
      usage: usage ?? { auth_count: 0, valuation_count: 0 },
      devices: devices.data ?? [],
      security: security.data ?? [],
    });
  } catch (e) {
    return errorResponse(e);
  }
}
