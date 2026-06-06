import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazily-initialised server clients so the module never throws at import/build
// time when the SaaS env vars aren't configured yet.

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set.');
  _stripe = new Stripe(key); // uses the account's default API version
  return _stripe;
}

let _admin: SupabaseClient | null = null;
/** Supabase client with the SERVICE ROLE key — bypasses RLS. SERVER ONLY. */
export function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase service role is not configured.');
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

/** Validates the Bearer access token and returns the user id (or null). */
export async function getUserId(req: Request): Promise<string | null> {
  const header = req.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await getAdmin().auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}
