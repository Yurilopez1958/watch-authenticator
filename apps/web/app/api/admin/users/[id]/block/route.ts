import { getAdmin } from '@/lib/server/clients';
import { requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse } from '@/lib/server/errors';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    const { block } = (await req.json().catch(() => ({}))) as { block?: boolean };
    const status = block ? 'blocked' : 'active';
    const admin = getAdmin();
    await admin.from('profiles').update({ status }).eq('id', id);
    await admin.from('security_events').insert({ user_id: id, type: 'manual_block', severity: 2, details: { status } });
    return Response.json({ ok: true, status });
  } catch (e) {
    return errorResponse(e);
  }
}
