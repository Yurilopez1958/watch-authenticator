import { getAdmin, getUserId } from '@/lib/server/clients';
import { ERRORS, errorResponse } from '@/lib/server/errors';

/** Revokes one of the caller's API keys. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw ERRORS.unauthorized();
    const { id } = await ctx.params;
    await getAdmin().from('api_keys').update({ revoked: true }).eq('id', id).eq('user_id', userId);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
