import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when Supabase env vars are configured (cloud sync available). */
export const supabaseEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Returns the browser Supabase client, or null if not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
