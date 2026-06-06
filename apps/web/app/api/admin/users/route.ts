import { getAdmin } from '@/lib/server/clients';
import { requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse } from '@/lib/server/errors';

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
