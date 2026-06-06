import { getAdmin } from '@/lib/server/clients';
import { requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse } from '@/lib/server/errors';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const { data } = await getAdmin().from('payments')
      .select('id, user_id, amount_cents, currency, status, description, created_at')
      .order('created_at', { ascending: false }).limit(100);
    const totalCents = (data ?? []).filter((p: { status: string }) => p.status === 'paid')
      .reduce((s: number, p: { amount_cents: number }) => s + p.amount_cents, 0);
    return Response.json({ payments: data ?? [], totalCents });
  } catch (e) {
    return errorResponse(e);
  }
}
