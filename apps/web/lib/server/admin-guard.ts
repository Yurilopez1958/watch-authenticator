import { getAdmin, getUserId } from './clients';
import { ERRORS } from './errors';

/** Requires the caller to be a signed-in admin (profiles.role = 'admin'). */
export async function requireAdmin(req: Request): Promise<string> {
  const userId = await getUserId(req);
  if (!userId) throw ERRORS.unauthorized();
  const { data } = await getAdmin().from('profiles').select('role').eq('id', userId).single();
  if (data?.role !== 'admin') throw ERRORS.forbidden();
  return userId;
}
