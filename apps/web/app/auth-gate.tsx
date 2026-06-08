'use client';

import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/use-session';
import { LoginScreen } from './login-screen';

// Paths reachable without an active session (the reset-password flow needs to be
// usable before a normal session exists).
const PUBLIC_PATHS = ['/reset-password'];

/** Mandatory-login gate. When Supabase auth is configured and the user is not
 *  signed in, the whole app is replaced by the login screen. If auth is NOT
 *  configured, the app is shown normally (so a missing env var never locks it). */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { enabled, loading, session } = useSession();
  const pathname = usePathname();

  if (!enabled) return <>{children}</>;
  if (PUBLIC_PATHS.some((p) => (pathname ?? '').startsWith(p))) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-soft border-t-accent-bright animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  return <>{children}</>;
}
