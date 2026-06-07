import { createHash, randomBytes } from 'crypto';
import { getAdmin } from './clients';
import { ERRORS } from './errors';
import type { Ctx } from './guard';
import type { PlanId } from '@/lib/plans';

/** sha-256 hex of an API key. */
export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Generates a new dealer API key: { key (show once), hash (store), prefix }. */
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = 'wa_live_' + randomBytes(24).toString('hex');
  return { key: raw, hash: hashKey(raw), prefix: raw.slice(0, 12) };
}

/** Resolves the caller from an API key (Authorization: Bearer wa_live_... or X-API-Key). */
export async function requireApiKey(req: Request): Promise<Ctx> {
  const auth = req.headers.get('authorization');
  const fromBearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const key = fromBearer ?? req.headers.get('x-api-key');
  if (!key || !key.startsWith('wa_')) throw ERRORS.unauthorized();

  const admin = getAdmin();
  const { data } = await admin.from('api_keys')
    .select('id, user_id, revoked').eq('key_hash', hashKey(key)).single();
  if (!data || data.revoked) throw ERRORS.unauthorized();

  // Best-effort last-used stamp (don't block the request on it).
  void admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);

  const { data: profile } = await admin.from('profiles').select('status').eq('id', data.user_id).single();
  if (profile?.status === 'blocked') throw ERRORS.accountBlocked();

  const { data: sub } = await admin.from('subscriptions').select('plan').eq('user_id', data.user_id).single();
  return { userId: data.user_id, plan: (sub?.plan ?? 'free') as PlanId };
}
