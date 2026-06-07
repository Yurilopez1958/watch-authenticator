'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';
import { useSession } from '@/lib/use-session';
import { authedFetch } from '@/lib/billing-client';

type Key = { id: number; name: string | null; prefix: string; last_used_at: string | null; revoked: boolean; created_at: string };

export default function DeveloperPage() {
  const { t } = useLang();
  const { session } = useSession();
  const [keys, setKeys] = useState<Key[]>([]);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const load = async () => {
    const res = await authedFetch('/api/keys');
    if (!res.ok) { setUnavailable(true); return; }
    const j = await res.json().catch(() => null);
    setKeys(j?.keys ?? []);
  };
  useEffect(() => { if (session) void load(); }, [session]);

  const create = async () => {
    setBusy(true); setNewKey(null);
    const res = await authedFetch('/api/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    setBusy(false);
    if (!res.ok) { setUnavailable(true); return; }
    const j = await res.json().catch(() => null);
    if (j?.key) { setNewKey(j.key); setName(''); void load(); }
  };
  const revoke = async (id: number) => {
    await authedFetch(`/api/keys/${id}/revoke`, { method: 'POST' });
    void load();
  };
  const copy = (s: string) => { void navigator.clipboard?.writeText(s); };

  const base = typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio';

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('API para negocios', 'Business API')}</h1>
        <p className="text-muted text-sm max-w-2xl">
          {t('Permite que otros programas usen tu autenticación y tu valoración de forma automática, sin entrar a la web. Pensado para negocios que quieran integrar el servicio en su propio sistema.', 'Lets other software use your authentication and valuation automatically, without opening the website. Built for businesses that want to integrate the service into their own system.')}
        </p>
      </section>

      <section className="card p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold mb-1">{t('¿Qué es esto, en simple?', 'What is this, in plain terms?')}</h2>
          <p className="text-sm text-muted leading-relaxed">
            {t('Es una «puerta de servicio» para que otros programas consulten tu app de forma automática (no una persona haciendo clics). Tú vendes el acceso; ellos lo integran en su propio software.', 'It is a “service door” so other software can query your app automatically (not a person clicking). You sell the access; they integrate it into their own software.')}
          </p>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wide text-dim mb-2">{t('Para quién es', 'Who it is for')}</h3>
          <p className="text-sm text-muted leading-relaxed">
            {t('Negocios que necesitan autenticar o valorar relojes en cantidad desde su propio sistema: tiendas y plataformas de compraventa, casas de empeño, tasadoras y aseguradoras.', 'Businesses that need to authenticate or value watches at scale from their own system: shops and marketplaces, pawn shops, appraisers and insurers.')}
          </p>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wide text-dim mb-2">{t('Cómo funciona', 'How it works')}</h3>
          <ol className="text-sm text-muted space-y-1.5 list-decimal pl-5 leading-relaxed">
            <li>{t('Creas una «clave» (más abajo): es la contraseña que identifica a ese cliente.', 'You create a “key” (below): the password that identifies that client.')}</li>
            <li>{t('El programador del cliente la pone en su sistema y ya puede consultar tu servicio.', "The client's developer puts it in their system and can call your service.")}</li>
            <li>{t('Cada consulta que hacen cuenta en tu plan, igual que si la hicieras tú.', 'Every call they make counts against your plan, just like if you made it.')}</li>
          </ol>
        </div>
        <p className="text-xs text-dim">{t('Nota: la parte técnica (los ejemplos del final) la suele configurar un programador. Tú solo creas la clave y se la entregas.', 'Note: the technical part (the examples at the end) is usually set up by a developer. You just create the key and hand it over.')}</p>
      </section>

      {!session ? (
        <section className="card p-5"><p className="text-sm text-amber-300">{t('Inicia sesión (en Planes) para gestionar tus claves de API.', 'Sign in (in Plans) to manage your API keys.')}</p></section>
      ) : unavailable ? (
        <section className="card p-5"><p className="text-sm text-amber-300">{t('La API aún no está activa en este entorno.', 'The API is not active in this environment yet.')}</p></section>
      ) : (
        <>
          <section className="card p-5 space-y-3">
            <div className="text-sm font-semibold">{t('Crear nueva clave', 'Create new key')}</div>
            <div className="flex gap-2 flex-wrap">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Nombre (p. ej. "Mi tienda")', 'Name (e.g. "My shop")')} className="field max-w-xs text-sm" />
              <button onClick={() => void create()} disabled={busy} className="btn-primary text-sm">{busy ? t('Creando…', 'Creating…') : t('Crear clave', 'Create key')}</button>
            </div>
            {newKey && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
                <div className="text-xs text-emerald-200">{t('Copia esta clave ahora — no se volverá a mostrar.', 'Copy this key now — it will not be shown again.')}</div>
                <div className="flex gap-2 items-center">
                  <code className="text-xs font-mono break-all flex-1">{newKey}</code>
                  <button onClick={() => copy(newKey)} className="btn-ghost text-xs shrink-0">{t('Copiar', 'Copy')}</button>
                </div>
              </div>
            )}
          </section>

          <section className="card p-5">
            <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Tus claves', 'Your keys')}</div>
            <div className="divide-y divide-soft">
              {keys.length === 0 && <div className="text-sm text-dim py-2">{t('Aún no tienes claves.', 'No keys yet.')}</div>}
              {keys.map((k) => (
                <div key={k.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-mono">{k.prefix}…</span> {k.name && <span className="text-dim">· {k.name}</span>}
                    {k.revoked && <span className="text-red-300 text-xs ml-2">{t('revocada', 'revoked')}</span>}
                  </div>
                  {!k.revoked && <button onClick={() => void revoke(k.id)} className="btn-ghost text-xs">{t('Revocar', 'Revoke')}</button>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="card p-5 space-y-3">
        <div className="text-sm font-semibold">{t('Ejemplos para tu programador', 'Examples for your developer')}</div>
        <p className="text-xs text-dim -mt-1">{t('Esto es para quien integre el servicio; no necesitas entenderlo para crear la clave.', 'This is for whoever integrates the service; you do not need to understand it to create the key.')}</p>
        <pre className="text-[0.7rem] font-mono bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{`# ${t('Valuación', 'Valuation')}
curl -X POST ${base}/api/v1/value \\
  -H "Authorization: Bearer wa_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"brand":"Rolex","model":"Submariner","reference":"126610LN"}'

# ${t('Autenticación (foto de una parte)', 'Authentication (photo of a part)')}
curl -X POST ${base}/api/v1/authenticate \\
  -H "Authorization: Bearer wa_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"brandName":"Rolex","modelName":"Submariner","part":"bezel",
       "examined":{"imageData":"<base64>","mediaType":"image/jpeg"}}'`}</pre>
        <p className="text-xs text-dim">{t('Respuesta: JSON con "data". Errores: 401 (clave inválida), 402 (pago pendiente), 429 (límite del plan).', 'Response: JSON with "data". Errors: 401 (invalid key), 402 (payment due), 429 (plan limit).')}</p>

        <div className="border-t border-soft pt-3 mt-1">
          <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Qué significa cada cosa', 'What each part means')}</div>
          <p className="text-xs text-dim mb-3">{t('El código va en inglés porque son instrucciones que el programa lee literalmente (no se traducen, igual que un email o un número de serie). Esto explica, en español, qué hace cada parte:', 'The code is in English because these are instructions the program reads literally (they are not translated, like an email or a serial number). Here is what each part does, in plain language:')}</p>
          <ul className="text-xs text-muted space-y-1.5 leading-relaxed">
            <li><span className="font-semibold">{t('Valoración', 'Valuation')}</span> — {t('pide el precio de mercado de un reloj a partir de su marca, modelo y referencia.', 'requests the market price of a watch from its brand, model and reference.')}</li>
            <li><span className="font-semibold">{t('Autenticación', 'Authentication')}</span> — {t('envía la foto de una parte (p. ej. el bisel) y devuelve el análisis de autenticidad.', 'sends a photo of a part (e.g. the bezel) and returns the authenticity analysis.')}</li>
            <li><code className="font-mono text-accent-bright">curl -X POST</code> — {t('un programa enviando la consulta a tu servidor (no una persona).', 'a program sending the query to your server (not a person).')}</li>
            <li><code className="font-mono text-accent-bright">Authorization: Bearer wa_live_…</code> — {t('la clave secreta del cliente (su «contraseña» para identificarse y que se le cobre).', "the client's secret key (their “password” to identify themselves and be billed).")}</li>
            <li><code className="font-mono text-accent-bright">brand / model / reference</code> — {t('marca, modelo y referencia del reloj.', 'the watch brand, model and reference.')}</li>
            <li><code className="font-mono text-accent-bright">part / examined</code> — {t('la parte fotografiada y la imagen (en formato base64) que se analiza.', 'the photographed part and the image (in base64 format) being analyzed.')}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
