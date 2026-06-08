'use client';

import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useSession } from '@/lib/use-session';

type Mode = 'signin' | 'signup';

/** Full-screen login / sign-up gate. Email+password is primary; a magic-link
 *  fallback and a password-reset flow are included. */
export function LoginScreen() {
  const { t } = useLang();
  const { signInWithPassword, signUpWithPassword, resetPassword, signInWithEmail } = useSession();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = validEmail && password.length >= 6 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword(email, password);
        if (error) setError(t('Email o contraseña incorrectos.', 'Wrong email or password.'));
        // On success the auth listener flips the gate automatically — no redirect needed.
      } else {
        const { error, needsConfirm } = await signUpWithPassword(email, password);
        if (error) {
          setError(/registered|already/i.test(error)
            ? t('Ese email ya tiene cuenta. Inicia sesión o usa "¿Olvidaste tu contraseña?".', 'That email already has an account. Sign in or use "Forgot your password?".')
            : t('No se pudo crear la cuenta. Revisa los datos.', 'Could not create the account. Check your details.'));
        } else if (needsConfirm) {
          setNotice(t('Cuenta creada. Revisa tu correo y confirma para entrar.', 'Account created. Check your email and confirm to sign in.'));
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async () => {
    if (!validEmail) { setError(t('Escribe tu email primero.', 'Type your email first.')); return; }
    setBusy(true); setError(null); setNotice(null);
    const { error } = await resetPassword(email);
    setBusy(false);
    if (error) setError(t('No se pudo enviar el correo de recuperación.', 'Could not send the recovery email.'));
    else setNotice(t('Te enviamos un correo para restablecer la contraseña.', 'We sent you an email to reset your password.'));
  };

  const onMagicLink = async () => {
    if (!validEmail) { setError(t('Escribe tu email primero.', 'Type your email first.')); return; }
    setBusy(true); setError(null); setNotice(null);
    const { error } = await signInWithEmail(email.trim(), '/');
    setBusy(false);
    if (error) setError(t('No se pudo enviar el enlace.', 'Could not send the link.'));
    else setNotice(t('Revisa tu correo: te enviamos un enlace para entrar.', 'Check your email: we sent you a sign-in link.'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-soft border border-soft text-accent-bright">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="6" /><polyline points="12 9 12 12 13.5 13.5" />
              <path d="M9 4.55a8 8 0 0 1 6 0M9 19.45a8 8 0 0 0 6 0M21 12h-3M6 12H3" />
            </svg>
          </span>
          <span className="text-xl font-semibold text-gradient">Watch Authenticator</span>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <h1 className="text-lg font-bold">{mode === 'signin' ? t('Inicia sesión', 'Sign in') : t('Crea tu cuenta', 'Create your account')}</h1>
            <p className="text-xs text-muted mt-1">{t('Necesitas una cuenta para usar la app.', 'You need an account to use the app.')}</p>
          </div>

          {/* Mode toggle */}
          <div className="inline-flex rounded-lg border border-soft overflow-hidden text-sm w-full">
            <button type="button" onClick={() => { setMode('signin'); setError(null); setNotice(null); }} className={`flex-1 py-1.5 ${mode === 'signin' ? 'bg-accent text-white' : 'text-dim hover:text-foreground'}`}>{t('Entrar', 'Sign in')}</button>
            <button type="button" onClick={() => { setMode('signup'); setError(null); setNotice(null); }} className={`flex-1 py-1.5 border-l border-soft ${mode === 'signup' ? 'bg-accent text-white' : 'text-dim hover:text-foreground'}`}>{t('Crear cuenta', 'Sign up')}</button>
          </div>

          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-1">{t('Correo', 'Email')}</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="tu@correo.com" />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-wide text-dim mb-1">{t('Contraseña', 'Password')}</span>
            <input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }} className="field" placeholder={t('mínimo 6 caracteres', 'at least 6 characters')} />
          </label>

          {error && <div className="text-xs text-red-300 border-l-4 border-l-red-500 bg-red-500/10 rounded-lg p-2.5">{error}</div>}
          {notice && <div className="text-xs text-emerald-300 border-l-4 border-l-emerald-500 bg-emerald-500/10 rounded-lg p-2.5">{notice}</div>}

          <button onClick={() => void submit()} disabled={!canSubmit} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? t('Un momento…', 'One moment…') : mode === 'signin' ? t('Entrar', 'Sign in') : t('Crear cuenta', 'Create account')}
          </button>

          <div className="flex items-center justify-between text-xs">
            {mode === 'signin'
              ? <button type="button" onClick={() => void onForgot()} className="text-accent-bright hover:underline">{t('¿Olvidaste tu contraseña?', 'Forgot your password?')}</button>
              : <span className="text-dim">{t('La contraseña debe tener 6+ caracteres.', 'Password must be 6+ characters.')}</span>}
            <button type="button" onClick={() => void onMagicLink()} className="text-dim hover:text-foreground">{t('Entrar con enlace por correo', 'Sign in with email link')}</button>
          </div>
        </div>

        <p className="text-center text-[0.7rem] text-dim mt-4">{t('¿Primera vez? Usa "Crear cuenta". Si ya tenías cuenta por enlace y no recuerdas contraseña, usa "¿Olvidaste tu contraseña?".', 'First time? Use "Sign up". If you already had a link-only account, use "Forgot your password?".')}</p>
      </div>
    </div>
  );
}
