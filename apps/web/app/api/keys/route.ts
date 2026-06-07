import { getAdmin, getUserId } from '@/lib/server/clients';
import { generateApiKey } from '@/lib/server/api-key';
import { ERRORS, errorResponse } from '@/lib/server/errors';

/** Lists the caller's API keys (metadata only — the raw key is never stored). */
export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw ERRORS.unauthorized();
    const { data } = await getAdmin().from('api_keys')
      .select('id, name, prefix, last_used_at, revoked, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false });
    return Response.json({ keys: data ?? [] });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Creates a new API key. The raw key is returned ONCE and never stored. */
export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw ERRORS.unauthorized();
    const { name } = (await req.json().catch(() => ({}))) as { name?: string };
    const { key, hash, prefix } = generateApiKey();
    const { error } = await getAdmin().from('api_keys').insert({
      user_id: userId, name: (name ?? '').slice(0, 60) || null, prefix, key_hash: hash,
    });
    if (error) throw error;
    return Response.json({ key, prefix }); // show `key` once
  } catch (e) {
    return errorResponse(e);
  }
}
