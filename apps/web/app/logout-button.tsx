'use client';

import { useLang } from '@/lib/i18n';
import { useSession } from '@/lib/use-session';

/** Sign-out control shown in the header once a user is signed in. */
export function LogoutButton() {
  const { t } = useLang();
  const { session, signOut } = useSession();
  if (!session) return null;
  return (
    <button
      onClick={() => void signOut()}
      title={session.user?.email ?? ''}
      aria-label={t('Cerrar sesión', 'Sign out')}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-soft text-dim hover:text-foreground hover:border-accent transition-colors shrink-0"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="text-sm hidden xs:inline">{t('Salir', 'Sign out')}</span>
    </button>
  );
}
