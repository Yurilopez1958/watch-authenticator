'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { authedFetch } from '@/lib/billing-client';

type Tab = 'users' | 'payments' | 'security';

type UserRow = {
  id: string; email: string | null; role: string; status: string; created_at: string;
  subscriptions?: { plan: string; status: string } | { plan: string; status: string }[] | null;
};
type Detail = {
  profile: { id: string; email: string | null; role: string; status: string; created_at: string } | null;
  subscription: { plan: string; status: string; current_period_end: string | null } | null;
  usage: { auth_count: number; valuation_count: number };
  devices: { device_id: string; last_ip: string | null; last_seen: string; revoked: boolean }[];
  security: { type: string; severity: number; ip: string | null; created_at: string }[];
};

const sub1 = (s: UserRow['subscriptions']) => (Array.isArray(s) ? s[0] : s) ?? null;

export default function AdminPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('users');
  const [authz, setAuthz] = useState<'checking' | 'ok' | 'denied'>('checking');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);

  const [payments, setPayments] = useState<{ list: Record<string, unknown>[]; totalCents: number }>({ list: [], totalCents: 0 });
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);

  const loadUsers = useCallback(async (q: string) => {
    const res = await authedFetch(`/api/admin/users?query=${encodeURIComponent(q)}`);
    if (res.status === 401 || res.status === 403) { setAuthz('denied'); return; }
    setAuthz('ok');
    const j = await res.json().catch(() => null);
    setUsers(j?.users ?? []);
  }, []);

  useEffect(() => { void loadUsers(''); }, [loadUsers]);

  const openUser = async (id: string) => {
    setBusy(true);
    const res = await authedFetch(`/api/admin/users/${id}`);
    const j = await res.json().catch(() => null);
    setDetail(j);
    setBusy(false);
  };
  const toggleBlock = async (id: string, block: boolean) => {
    await authedFetch(`/api/admin/users/${id}/block`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ block }) });
    await openUser(id);
    await loadUsers(query);
  };
  const loadPayments = async () => {
    const res = await authedFetch('/api/admin/payments');
    const j = await res.json().catch(() => null);
    setPayments({ list: j?.payments ?? [], totalCents: j?.totalCents ?? 0 });
  };
  const loadSecurity = async () => {
    const res = await authedFetch('/api/admin/security');
    const j = await res.json().catch(() => null);
    setEvents(j?.events ?? []);
  };

  useEffect(() => { if (tab === 'payments') void loadPayments(); if (tab === 'security') void loadSecurity(); }, [tab]);

  if (authz === 'denied') {
    return (
      <div className="card p-6 max-w-lg">
        <h1 className="text-xl font-bold mb-2">{t('Panel de administración', 'Admin panel')}</h1>
        <p className="text-sm text-amber-300">{t('No autorizado. Inicia sesión con una cuenta de administrador (o el sistema aún no está configurado).', 'Not authorized. Sign in with an admin account (or the system is not configured yet).')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('Panel de administración', 'Admin panel')}</h1>

      <div className="flex gap-2">
        {(['users', 'payments', 'security'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`chip cursor-pointer ${tab === tb ? '!bg-accent !text-white !border-transparent' : ''}`}>
            {tb === 'users' ? t('Usuarios', 'Users') : tb === 'payments' ? t('Pagos', 'Payments') : t('Seguridad', 'Security')}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="grid md:grid-cols-2 gap-5">
          <section className="card p-4 space-y-3">
            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void loadUsers(query); }} placeholder={t('Buscar por correo…', 'Search by email…')} className="field text-sm" />
              <button onClick={() => void loadUsers(query)} className="btn-ghost text-sm">{t('Buscar', 'Search')}</button>
            </div>
            <div className="divide-y divide-soft">
              {users.length === 0 && <div className="text-sm text-dim py-3">{t('Sin usuarios.', 'No users.')}</div>}
              {users.map((u) => {
                const s = sub1(u.subscriptions);
                return (
                  <button key={u.id} onClick={() => void openUser(u.id)} className="w-full text-left py-2.5 flex items-center justify-between gap-2 hover:bg-accent-soft px-2 rounded">
                    <span className="text-sm truncate">{u.email ?? u.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {s && <span className="chip text-[0.6rem]">{s.plan}</span>}
                      <span className={`text-[0.65rem] ${u.status === 'blocked' ? 'text-red-300' : u.status === 'review' ? 'text-amber-300' : 'text-emerald-300'}`}>{u.status}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-4">
            {!detail ? (
              <div className="text-sm text-dim">{t('Selecciona un usuario para ver el detalle.', 'Select a user to see details.')}</div>
            ) : busy ? (
              <div className="text-sm text-dim">{t('Cargando…', 'Loading…')}</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="font-semibold">{detail.profile?.email ?? detail.profile?.id}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-dim">{t('Plan', 'Plan')}:</span> {detail.subscription?.plan ?? 'free'}</div>
                  <div><span className="text-dim">{t('Suscripción', 'Subscription')}:</span> {detail.subscription?.status ?? '—'}</div>
                  <div><span className="text-dim">{t('Estado', 'Status')}:</span> {detail.profile?.status}</div>
                  <div><span className="text-dim">{t('Rol', 'Role')}:</span> {detail.profile?.role}</div>
                  <div><span className="text-dim">{t('Auth/mes', 'Auth/mo')}:</span> {detail.usage.auth_count}</div>
                  <div><span className="text-dim">{t('Valuaciones/mes', 'Valuations/mo')}:</span> {detail.usage.valuation_count}</div>
                </div>
                <div className="border-t border-soft pt-2">
                  <div className="text-xs uppercase tracking-wide text-dim mb-1">{t('Dispositivos', 'Devices')} ({detail.devices.length})</div>
                  {detail.devices.slice(0, 6).map((d) => (
                    <div key={d.device_id} className="text-[0.7rem] text-muted flex justify-between"><span className="font-mono">{d.device_id.slice(0, 8)} · {d.last_ip ?? '—'}</span><span>{new Date(d.last_seen).toLocaleDateString()}</span></div>
                  ))}
                </div>
                {detail.security.length > 0 && (
                  <div className="border-t border-soft pt-2">
                    <div className="text-xs uppercase tracking-wide text-dim mb-1">{t('Seguridad', 'Security')}</div>
                    {detail.security.slice(0, 5).map((e, i) => (
                      <div key={i} className="text-[0.7rem] text-amber-300/90">{e.type} · {new Date(e.created_at).toLocaleString()}</div>
                    ))}
                  </div>
                )}
                {detail.profile && (
                  <button
                    onClick={() => void toggleBlock(detail.profile!.id, detail.profile!.status !== 'blocked')}
                    className="btn-ghost text-sm"
                    style={detail.profile.status !== 'blocked' ? { borderColor: 'rgba(239,68,68,0.5)', color: '#fca5a5' } : {}}
                  >
                    {detail.profile.status === 'blocked' ? t('Desbloquear', 'Unblock') : t('Bloquear cuenta', 'Block account')}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'payments' && (
        <section className="card p-4 space-y-2">
          <div className="text-sm">{t('Total cobrado', 'Total collected')}: <span className="font-bold font-mono">{(payments.totalCents / 100).toLocaleString()} </span></div>
          <div className="divide-y divide-soft">
            {payments.list.length === 0 && <div className="text-sm text-dim py-3">{t('Sin pagos.', 'No payments.')}</div>}
            {payments.list.map((p, i) => (
              <div key={i} className="py-2 flex justify-between text-xs">
                <span>{String(p.description ?? p.id)}</span>
                <span className="font-mono">{(Number(p.amount_cents) / 100).toLocaleString()} {String(p.currency).toUpperCase()} · {String(p.status)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'security' && (
        <section className="card p-4">
          <div className="divide-y divide-soft">
            {events.length === 0 && <div className="text-sm text-dim py-3">{t('Sin alertas.', 'No alerts.')}</div>}
            {events.map((e, i) => (
              <div key={i} className="py-2 flex justify-between text-xs">
                <span className={Number(e.severity) >= 3 ? 'text-red-300' : 'text-amber-300'}>{String(e.type)} · {String(e.ip ?? '')}</span>
                <span className="text-dim">{new Date(String(e.created_at)).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
