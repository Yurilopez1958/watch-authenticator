import { getAdmin } from '@/lib/server/clients';
import { requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse } from '@/lib/server/errors';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    let q = getAdmin().from('security_events')
      .select('id, user_id, type, severity, ip, details, created_at')
      .order('created_at', { ascending: false }).limit(100);
    if (type) q = q.eq('type', type);
    const { data } = await q;
    return Response.json({ events: data ?? [] });
  } catch (e) {
    return errorResponse(e);
  }
}
