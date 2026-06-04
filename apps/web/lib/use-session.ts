'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, supabaseEnabled } from './supabase';

export type SessionState = {
  enabled: boolean;
  loading: boolean;
  session: Session | null;
  email: string | null;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

/** React hook exposing the current Supabase auth session + magic-link sign-in. */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setLoading(false); }
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      if (alive) setSession(s);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const signInWithEmail = async (email: string): Promise<{ error: string | null }> => {
    const sb = getSupabase();
    if (!sb) return { error: 'Sync is not configured.' };
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/gallery` : undefined;
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : {},
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
  };

  return {
    enabled: supabaseEnabled,
    loading,
    session,
    email: session?.user?.email ?? null,
    signInWithEmail,
    signOut,
  };
}
