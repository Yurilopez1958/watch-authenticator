'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useSession } from '@/lib/use-session';

/** Landing page for the password-reset email link. Supabase establishes a
 *  recovery session from the link; here the user sets a new password. */
export default function ResetPasswordPage() {
  const { t } = useLang();
  const { loading, session, updatePassword } = useSession();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = password.length >= 6 && password === confirm && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setError(null);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) setError(t('No se pudo actualizar la contraseña. El enlace puede haber caducado — pide otro.', 'Could not update the password. The link may have expired — request a new one.'));
    else setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm card p-6 space-y-4">
        <h1 className="text-lg font-bold">{t('Nueva contraseña', 'New password')}</h1>

        {done ? (
          <>
            <div className="text-sm text-emerald-300 border-l-4 border-l-emerald-500 bg-emerald-500/10 rounded-lg p-3">
              {t('¡Contraseña actualizada! Ya puedes usar la app.', 'Password updated! You can use the app now.')}
            </div>
            <Link href="/" className="btn-primary w-full text-center">{t('Entrar a la app', 'Go to the app')}</Link>
          </>
        ) : !loading && !session ? (
          <>
            <p className="text-sm text-amber-300">{t('Este enlace no es válido o ha caducado. Pide uno nuevo desde "¿Olvidaste tu contraseña?".', 'This link is invalid or expired. Request a new one from "Forgot your password?".')}</p>
            <Link href="/" className="btn-ghost w-full text-center">{t('Volver al inicio de sesión', 'Back to sign in')}</Link>
          </>
        ) : (
          <>
            <p className="text-xs text-muted">{t('Elige una contraseña nueva (mínimo 6 caracteres).', 'Choose a new password (at least 6 characters).')}</p>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-1">{t('Nueva contraseña', 'New password')}</span>
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-wide text-dim mb-1">{t('Repite la contraseña', 'Repeat password')}</span>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }} className="field" />
            </label>
            {confirm.length > 0 && password !== confirm && <p className="text-xs text-amber-300">{t('Las contraseñas no coinciden.', 'Passwords do not match.')}</p>}
            {error && <div className="text-xs text-red-300 border-l-4 border-l-red-500 bg-red-500/10 rounded-lg p-2.5">{error}</div>}
            <button onClick={() => void submit()} disabled={!canSubmit} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {busy ? t('Guardando…', 'Saving…') : t('Guardar contraseña', 'Save password')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
