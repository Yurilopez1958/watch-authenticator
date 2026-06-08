import { getAdmin } from '@/lib/server/clients';
import { requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse } from '@/lib/server/errors';
import type { PlanId } from '@/lib/plans';

const PLAN_IDS: readonly PlanId[] = ['free', 'pro', 'business'];

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const q = url.searchParams.get('query') ?? '';
    const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
    const size = 25;

    let sel = getAdmin().from('profiles')
      .select('id, email, role, status, created_at, subscriptions(plan, status, current_period_end)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * size, page * size + size - 1);
    if (q) sel = sel.ilike('email', `%${q}%`);

    const { data, count } = await sel;
    return Response.json({ users: data ?? [], total: count ?? 0, page, size });
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Admin-only account creation. Two modes:
 *  - 'invite'   → Supabase sends an invitation email; the person sets their own
 *                 password (lands on /reset-password). No password handled here.
 *  - 'password' → creates an already-active account with a temporary password
 *                 supplied by the admin (email pre-confirmed so they can sign in).
 * Optionally sets the plan (free/pro/business) and role (user/admin). The
 * on_auth_user_created trigger creates the profile + a free subscription; we
 * apply the chosen role/plan on top.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = (await req.json().catch(() => ({}))) as {
      email?: string; mode?: string; password?: string; plan?: string; role?: string;
    };

    const email = String(body.email ?? '').trim().toLowerCase();
    const mode: 'invite' | 'password' = body.mode === 'password' ? 'password' : 'invite';
    const role: 'user' | 'admin' = body.role === 'admin' ? 'admin' : 'user';
    const plan = (PLAN_IDS.includes(body.plan as PlanId) ? body.plan : 'free') as PlanId;
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json({ error: 'invalid_email', message: { es: 'Email no válido.', en: 'Invalid email.' } }, { status: 400 });
    }
    if (mode === 'password' && password.length < 8) {
      return Response.json({ error: 'weak_password', message: { es: 'La contraseña temporal debe tener al menos 8 caracteres.', en: 'The temporary password must be at least 8 characters.' } }, { status: 400 });
    }

    const admin = getAdmin();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    let userId: string | null = null;
    if (mode === 'invite') {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(
        email,
        appUrl ? { redirectTo: `${appUrl}/reset-password` } : {},
      );
      if (error) {
        return Response.json({ error: 'create_failed', message: { es: `No se pudo invitar: ${error.message}`, en: `Could not invite: ${error.message}` } }, { status: 400 });
      }
      userId = data.user?.id ?? null;
    } else {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) {
        return Response.json({ error: 'create_failed', message: { es: `No se pudo crear: ${error.message}`, en: `Could not create: ${error.message}` } }, { status: 400 });
      }
      userId = data.user?.id ?? null;
    }

    if (!userId) {
      return Response.json({ error: 'create_failed', message: { es: 'No se pudo crear la cuenta.', en: 'Could not create the account.' } }, { status: 400 });
    }

    // Apply role / plan on top of the trigger-created profile + free subscription.
    if (role === 'admin') {
      await admin.from('profiles').update({ role: 'admin' }).eq('id', userId);
    }
    if (plan !== 'free') {
      await admin.from('subscriptions').upsert({ user_id: userId, plan, status: 'active' }, { onConflict: 'user_id' });
    }

    return Response.json({ ok: true, userId, mode, plan, role });
  } catch (e) {
    return errorResponse(e);
  }
}
