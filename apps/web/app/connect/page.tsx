'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';

/** Bilingual string pair. */
type Bi = { es: string; en: string };

type NitonModel = {
  id: 'xl2' | 'xl3t' | 'xl5' | 'xl5plus';
  name: string;
  bluetooth: boolean;
  wifi: boolean;
  software: 'NDT' | 'NitonConnect';
  notes: Bi;
};

const NITON_MODELS: readonly NitonModel[] = [
  {
    id: 'xl2',
    name: 'Niton XL2 Precious Metals',
    bluetooth: true,
    wifi: false,
    software: 'NDT',
    notes: {
      es: 'Bluetooth Classic SPP (solo impresora/escáner). USB-mini + RS-232.',
      en: 'Bluetooth Classic SPP (printer/scanner only). USB-mini + RS-232.',
    },
  },
  {
    id: 'xl3t',
    name: 'Niton XL3t / XL3 GOLDD',
    bluetooth: true,
    wifi: false,
    software: 'NDT',
    notes: {
      es: 'Bluetooth Classic SPP (solo impresora/escáner). USB-mini + RS-232.',
      en: 'Bluetooth Classic SPP (printer/scanner only). USB-mini + RS-232.',
    },
  },
  {
    id: 'xl5',
    name: 'Niton XL5',
    bluetooth: true,
    wifi: false,
    software: 'NitonConnect',
    notes: { es: 'Solo Bluetooth Classic SPP. USB-C.', en: 'Bluetooth Classic SPP only. USB-C.' },
  },
  {
    id: 'xl5plus',
    name: 'Niton XL5 Plus / Apollo',
    bluetooth: true,
    wifi: true,
    software: 'NitonConnect',
    notes: {
      es: 'Wi-Fi limitado solo a la sincronización con la nube de Thermo — no se puede apuntar a un endpoint propio sin el SDK.',
      en: 'Wi-Fi locked to Thermo cloud sync only — cannot point at custom endpoint without SDK.',
    },
  },
];

type Method = 'csv' | 'folder' | 'serial' | 'bluetooth' | 'wifi';

/** Minimal Web Serial typings (the lib DOM types may not include them). */
interface SerialPortLike {
  readable: ReadableStream<Uint8Array>;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}
interface SerialReaderLike {
  read(): Promise<{ value?: Uint8Array; done: boolean }>;
  cancel(): Promise<void>;
  releaseLock(): void;
}

const KNOWN_ELEMENTS: ReadonlySet<string> = new Set([
  'Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si', 'C', 'S', 'P',
  'Au', 'Ag', 'Pt', 'Pd', 'Ru', 'Rh', 'Ir', 'Ti', 'Zn', 'Sn', 'Co', 'Al', 'W', 'Nb',
]);

/** Parses a Niton serial/print line like "Fe 70.14 0.52" into element + percent.
 *  Accepts a comma decimal ("70,14") for instruments set to a European locale. */
function parseSerialLine(line: string): { element: string; pct: number } | null {
  const m = line.match(/^\s*([A-Za-z]{1,2})\s+(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const el = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1).toLowerCase();
  if (!KNOWN_ELEMENTS.has(el)) return null;
  const pct = parseFloat(m[2]!.replace(',', '.'));
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return null;
  return { element: el, pct };
}

type ConnectionStatus = {
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

const isTauri = (): boolean =>
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

const supportsWebBluetooth = (): boolean =>
  typeof navigator !== 'undefined' && 'bluetooth' in navigator;

const supportsWebSerial = (): boolean =>
  typeof navigator !== 'undefined' && 'serial' in navigator;

export default function ConnectPage() {
  const { t, lang } = useLang();
  const [modelId, setModelId] = useState<NitonModel['id']>('xl5');
  const [status, setStatus] = useState<Record<Method, ConnectionStatus | null>>({
    csv: null,
    folder: null,
    serial: null,
    bluetooth: null,
    wifi: null,
  });
  const [running, setRunning] = useState<Method | null>(null);

  // USB / Serial (Web Serial API) live-read state
  const [baudRate, setBaudRate] = useState(9600);
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialLog, setSerialLog] = useState<string[]>([]);
  const [serialReadings, setSerialReadings] = useState<{ element: string; pct: number }[]>([]);
  const serialPortRef = useRef<SerialPortLike | null>(null);
  const serialReaderRef = useRef<SerialReaderLike | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('niton-model');
    if (saved && NITON_MODELS.some((m) => m.id === saved)) {
      setModelId(saved as NitonModel['id']);
    }
  }, []);

  const onPickModel = (id: NitonModel['id']) => {
    setModelId(id);
    localStorage.setItem('niton-model', id);
    setStatus({ csv: null, folder: null, serial: null, bluetooth: null, wifi: null });
  };

  const model = NITON_MODELS.find((m) => m.id === modelId)!;

  const setMethodStatus = (m: Method, s: ConnectionStatus | null) =>
    setStatus((prev) => ({ ...prev, [m]: s }));

  const handleFolder = async () => {
    setRunning('folder');
    if (!isTauri()) {
      setMethodStatus('folder', {
        level: 'warning',
        message: t(
          'La vigilancia de carpetas solo está disponible en la app de escritorio (Tauri). Instala la versión de escritorio para habilitar la subida automática desde la carpeta de exportación del Niton.',
          'Folder watching is only available in the desktop app (Tauri). Install the desktop build to enable automatic upload from the Niton export folder.',
        ),
      });
      setRunning(null);
      return;
    }
    try {
      const tauriDialog: { open: (opts: unknown) => Promise<string | null> } =
        await import(/* webpackIgnore: true */ '@tauri-apps/plugin-dialog' as string);
      const folder = await tauriDialog.open({ directory: true, multiple: false });
      if (!folder) {
        setMethodStatus('folder', {
          level: 'info',
          message: t('Selección de carpeta cancelada.', 'Folder selection cancelled.'),
        });
        setRunning(null);
        return;
      }
      const tauriCore: { invoke: (cmd: string, args?: unknown) => Promise<unknown> } =
        await import(/* webpackIgnore: true */ '@tauri-apps/api/core' as string);
      await tauriCore.invoke('start_niton_watcher', { folder });
      localStorage.setItem('niton-watch-folder', folder as string);
      setMethodStatus('folder', {
        level: 'success',
        message: t(
          `Vigilando ${folder}. Los nuevos archivos CSV se analizarán y subirán automáticamente.`,
          `Watching ${folder}. New CSV files will be parsed and uploaded automatically.`,
        ),
      });
    } catch (err) {
      setMethodStatus('folder', {
        level: 'error',
        message: t(
          `No se pudo iniciar la vigilancia: ${(err as Error).message ?? err}`,
          `Could not start watcher: ${(err as Error).message ?? err}`,
        ),
      });
    } finally {
      setRunning(null);
    }
  };

  const handleBluetooth = async () => {
    setRunning('bluetooth');
    if (!supportsWebBluetooth()) {
      setMethodStatus('bluetooth', {
        level: 'error',
        message: t(
          'Este navegador no admite Web Bluetooth. Usa Chrome o Edge en Windows/Android. Nota: Web Bluetooth solo admite BLE/GATT; el Niton habla Bluetooth Classic SPP, por lo que un emparejamiento correcto no permitirá leer mediciones sin un SDK propio de Thermo.',
          'This browser does not support Web Bluetooth. Use Chrome or Edge on Windows/Android. Note: Web Bluetooth only supports BLE/GATT; the Niton speaks Bluetooth Classic SPP, so a successful pairing will not allow reading measurements without a custom SDK from Thermo.',
        ),
      });
      setRunning(null);
      return;
    }
    try {
      const nav = navigator as unknown as {
        bluetooth: { requestDevice: (opts: unknown) => Promise<{ name?: string; id: string }> };
      };
      const device = await nav.bluetooth.requestDevice({ acceptAllDevices: true });
      setMethodStatus('bluetooth', {
        level: 'warning',
        message: t(
          `Seleccionado "${device.name ?? device.id}". El navegador no puede leer mediciones por Bluetooth Classic SPP — incluso tras emparejar, el flujo del Niton va destinado a su impresora térmica. Para recibir datos de verdad seguimos necesitando o bien el SDK de Thermo o un receptor SPP personalizado fuera del navegador.`,
          `Picked "${device.name ?? device.id}". The browser cannot read measurements over Bluetooth Classic SPP — even after pairing, the Niton stream is destined for its thermal printer. To actually receive data we still need either the Thermo SDK or a custom SPP listener outside the browser.`,
        ),
      });
    } catch (err) {
      setMethodStatus('bluetooth', {
        level: 'info',
        message:
          (err as Error).name === 'NotFoundError'
            ? t('Ningún dispositivo seleccionado.', 'No device selected.')
            : t(
                `Falló la búsqueda de Bluetooth: ${(err as Error).message}`,
                `Bluetooth scan failed: ${(err as Error).message}`,
              ),
      });
    } finally {
      setRunning(null);
    }
  };

  const handleWifi = () => {
    setRunning('wifi');
    if (!model.wifi) {
      setMethodStatus('wifi', {
        level: 'warning',
        message: t(
          `${model.name} no tiene Wi-Fi. Solo el XL5 Plus / Apollo lo ofrecen.`,
          `${model.name} does not have Wi-Fi. Only XL5 Plus / Apollo offer it.`,
        ),
      });
    } else {
      setMethodStatus('wifi', {
        level: 'warning',
        message: t(
          'El Wi-Fi del XL5 Plus está bloqueado por firmware al portal de soporte de Thermo. Sin el SDK oficial no podemos redirigirlo a nuestro propio endpoint. Recomendado: combinar NitonConnect por LAN + una carpeta compartida vigilada por la app de escritorio.',
          'XL5 Plus Wi-Fi is locked by firmware to the Thermo support portal. Without the official SDK we cannot redirect it to our own endpoint. Recommended: combine NitonConnect over LAN + a shared folder watched by the desktop app.',
        ),
      });
    }
    setRunning(null);
  };

  const handleCsv = () => {
    setMethodStatus('csv', {
      level: 'success',
      message: t(
        `Listo. En el software ${model.software} activa "Also Save CSV" y sube el archivo en la página de Importar.`,
        `Ready. In the ${model.software} software enable "Also Save CSV" and upload the file in the Import page.`,
      ),
    });
  };

  // ---------- USB / Serial (Web Serial API) ----------
  const disconnectSerial = async () => {
    try { await serialReaderRef.current?.cancel(); } catch { /* noop */ }
    try { serialReaderRef.current?.releaseLock(); } catch { /* noop */ }
    try { await serialPortRef.current?.close(); } catch { /* noop */ }
    serialReaderRef.current = null;
    serialPortRef.current = null;
    setSerialConnected(false);
  };

  // Stop the serial port cleanly if the user navigates away.
  useEffect(() => () => { void disconnectSerial(); }, []);

  const handleSerial = async () => {
    if (!supportsWebSerial()) {
      setMethodStatus('serial', {
        level: 'error',
        message: t(
          'Este navegador no admite Web Serial. Usa Chrome o Edge en un ordenador de escritorio (Windows/macOS/Linux) sobre HTTPS. Web Serial no está disponible en móviles ni en Firefox/Safari.',
          'This browser does not support Web Serial. Use Chrome or Edge on a desktop computer (Windows/macOS/Linux) over HTTPS. Web Serial is not available on phones or in Firefox/Safari.',
        ),
      });
      return;
    }
    setRunning('serial');
    try {
      const ser = (navigator as unknown as { serial: { requestPort: () => Promise<SerialPortLike> } }).serial;
      const port = await ser.requestPort();
      await port.open({ baudRate });
      serialPortRef.current = port;
      setSerialConnected(true);
      setSerialLog([]);
      setSerialReadings([]);
      setMethodStatus('serial', {
        level: 'success',
        message: t(
          `Conectado a ${baudRate} baudios. En el Niton, fija el destino de salida/impresión al puerto serie (RS-232/USB) y dispara una lectura — las líneas entrantes aparecen abajo. No ejecutes NDT/NitonConnect en el mismo puerto COM al mismo tiempo.`,
          `Connected at ${baudRate} baud. On the Niton, set the output/print destination to the serial (RS-232/USB) port and trigger a reading — incoming lines appear below. Do not run NDT/NitonConnect on the same COM port at the same time.`,
        ),
      });

      const decoder = new TextDecoder();
      let buffer = '';
      const reader = port.readable.getReader() as unknown as SerialReaderLike;
      serialReaderRef.current = reader;
      void (async () => {
        try {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            for (const raw of lines) {
              const line = raw.trim();
              if (!line) continue;
              setSerialLog((prev) => [...prev, line].slice(-150));
              const r = parseSerialLine(line);
              if (r) {
                setSerialReadings((prev) => {
                  const next = prev.filter((x) => x.element !== r.element);
                  next.push(r);
                  return next;
                });
              }
            }
          }
        } catch (err) {
          setMethodStatus('serial', {
            level: 'error',
            message: t(
              `Lectura del puerto serie detenida: ${(err as Error).message}`,
              `Serial read stopped: ${(err as Error).message}`,
            ),
          });
          await disconnectSerial();
        }
      })();
    } catch (err) {
      const e = err as Error;
      setMethodStatus('serial', {
        level: e.name === 'NotFoundError' ? 'info' : 'error',
        message:
          e.name === 'NotFoundError'
            ? t('Ningún puerto serie seleccionado.', 'No serial port selected.')
            : t(`Falló la conexión serie: ${e.message}`, `Serial connection failed: ${e.message}`),
      });
    } finally {
      setRunning(null);
    }
  };

  const saveSerialReadings = () => {
    if (serialReadings.length === 0) return;
    localStorage.setItem(
      'niton-serial-readings',
      JSON.stringify({ readings: serialReadings, at: Date.now() }),
    );
    setMethodStatus('serial', {
      level: 'success',
      message: t(
        `Guardado(s) ${serialReadings.length} elemento(s) localmente. Puedes usarlos en Verificación rápida / Autenticar.`,
        `Saved ${serialReadings.length} element(s) locally. You can use them in Quick verify / Authenticate.`,
      ),
    });
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">{t('Conecta tu Niton XL', 'Connect to your Niton XL')}</h1>
        <p className="text-muted text-sm">
          {t(
            'Elige tu modelo exacto y la app te ofrecerá los métodos de conexión que realmente están disponibles para él. Somos transparentes sobre lo que funciona y lo que no.',
            'Pick your exact model and the app will offer the connection methods that are actually available for it. We are transparent about what works and what does not.',
          )}
        </p>
      </section>

      {/* Fixed warning: gun must be in metal/alloy mode for correct readings */}
      <section
        className="rounded-xl border-2 border-amber-500/60 bg-amber-500/10 p-4 flex items-start gap-3"
        role="alert"
      >
        <svg
          width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-amber-400 shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <div className="font-bold text-amber-300 text-sm uppercase tracking-wide mb-1">
            {t('Importante — modo de la pistola', 'Important — gun mode')}
          </div>
          <p className="text-sm text-amber-100/90 leading-relaxed">
            {t('Asegúrate de que la pistola Niton esté en ', 'Make sure the Niton gun is set to ')}
            <span className="font-bold">{t('modo METAL (General Metals / Alloy Mode)', 'METAL mode (General Metals / Alloy Mode)')}</span>
            {t(', ', ', ')}
            <span className="font-bold">{t('NO en modo Metales Preciosos', 'NOT Precious Metals mode')}</span>
            {t(
              ', para garantizar lecturas correctas de la composición de la aleación en la caja y los componentes del reloj.',
              ', to guarantee correct alloy-composition readings on the case and watch components.',
            )}
          </p>
        </div>
      </section>

      {/* Friendly "how to connect" quick guide */}
      <section className="card p-5">
        <h2 className="text-lg font-semibold mb-1">{t('Cómo llevar tus lecturas a la app', 'How to get your readings into the app')}</h2>
        <p className="text-sm text-muted mb-4">
          {t(
            'Tres formas, de la más fácil a la más técnica. La primera no necesita cables ni software.',
            'Three ways, from easiest to most technical. The first one needs no cables or software.',
          )}
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          {/* Option 1 — Photo (recommended) */}
          <div className="rounded-xl border border-accent/50 bg-accent-soft p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-9 h-9 rounded-lg bg-accent/20 text-accent-bright flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <div>
                <div className="font-semibold leading-tight">{t('Haz una foto', 'Take a photo')}</div>
                <span className="text-[0.65rem] font-semibold text-emerald-300 uppercase tracking-wide">{t('Lo más fácil · recomendado', 'Easiest · recommended')}</span>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed flex-1">
              {t(
                'Sin cables. Haz una foto de la pantalla del Niton con tu móvil u ordenador y la app lee los valores de los elementos por ti con IA. Solo comprueba antes que la pistola esté en modo metal.',
                'No cables. Snap a photo of the Niton screen with your phone or computer and the app reads the element values for you with AI. Just check the gun is in metal mode first.',
              )}
            </p>
            <Link href="/authenticate" className="text-sm text-accent-bright hover:underline font-medium mt-3">
              {t('Abre Autenticar → paso 2 → ', 'Open Authenticate → step 2 → ')}&ldquo;{t('Foto de pantalla', 'Photo of screen')}&rdquo; →
            </Link>
          </div>

          {/* Option 2 — USB cable */}
          <div className="rounded-xl border border-soft bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-9 h-9 rounded-lg bg-neutral-500/15 text-muted flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12V7a2 2 0 0 1 2-2h2" /><rect x="2" y="12" width="9" height="8" rx="1" /><path d="M11 16h4a2 2 0 0 0 2-2V8" /><circle cx="17" cy="6" r="2" />
                </svg>
              </span>
              <div className="font-semibold leading-tight">{t('Cable USB (en vivo)', 'USB cable (live)')}</div>
            </div>
            <p className="text-xs text-muted leading-relaxed flex-1">
              {t('Conecta la pistola a este ordenador con su cable USB / serie, configúrala para enviar las lecturas al puerto serie y luego pulsa ', 'Plug the gun into this computer with its USB / serial cable, set it to output readings to the serial port, then press ')}
              &ldquo;{t('Conectar puerto serie', 'Connect serial port')}&rdquo;
              {t(' abajo. Chrome o Edge en un ordenador de escritorio. Cierra NDT primero.', ' below. Chrome or Edge on a desktop. Close NDT first.')}
            </p>
            <a href="#serial" className="text-sm text-accent-bright hover:underline font-medium mt-3">
              {t('Ir a USB / Serie más abajo →', 'Jump to USB / Serial below →')}
            </a>
          </div>

          {/* Option 3 — CSV file */}
          <div className="rounded-xl border border-soft bg-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-9 h-9 rounded-lg bg-neutral-500/15 text-muted flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
                </svg>
              </span>
              <div className="font-semibold leading-tight">{t('Archivo CSV', 'CSV file')}</div>
            </div>
            <p className="text-xs text-muted leading-relaxed flex-1">
              {t('En el software del Niton (NDT / NitonConnect) activa ', 'In the Niton software (NDT / NitonConnect) turn on ')}
              &ldquo;Also Save CSV&rdquo;
              {t(' y luego sube ese archivo. Ideal si ya usas el software de escritorio con la pistola.', ', then upload that file. Best if you already use the desktop software with the gun.')}
            </p>
            <Link href="/import" className="text-sm text-accent-bright hover:underline font-medium mt-3">
              {t('Abrir la página de Importar →', 'Open the Import page →')}
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-soft text-accent-bright text-xs font-bold">1</span>
          <h2 className="text-lg font-semibold">{t('Tu modelo de Niton', 'Your Niton model')}</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {NITON_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => onPickModel(m.id)}
              className={`card text-left p-4 ${
                modelId === m.id ? 'border-accent bg-accent-soft' : 'card-hover'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-semibold">{m.name}</div>
                {modelId === m.id && <span className="text-accent-bright text-xs">● {t('seleccionado', 'selected')}</span>}
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className={`chip ${!m.bluetooth ? 'opacity-40' : ''}`}>{m.bluetooth ? 'BT' : t('sin BT', 'no BT')}</span>
                <span className={`chip ${!m.wifi ? 'opacity-40' : ''}`}>{m.wifi ? 'Wi-Fi' : t('sin Wi-Fi', 'no Wi-Fi')}</span>
                <span className="chip">{m.software}</span>
              </div>
              <div className="text-xs text-muted mt-3 leading-relaxed">{m.notes[lang]}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-soft text-accent-bright text-xs font-bold">2</span>
          <h2 className="text-lg font-semibold">{t('Método de conexión', 'Connection method')}</h2>
        </div>

        <MethodCard
          title={t('Subida de CSV (recomendado, siempre funciona)', 'CSV upload (recommended, always works)')}
          available={true}
          buttonLabel={t('Marcar listo y abrir Importar', 'Mark ready & open Import')}
          running={running === 'csv'}
          status={status.csv}
          onClick={handleCsv}
          description={t(
            `Activa "Also Save CSV" en ${model.software} y luego sube el archivo en la página de Importar. Funciona con todos los modelos.`,
            `Enable "Also Save CSV" in ${model.software}, then upload the file in the Import page. Works for every model.`,
          )}
          href="/import"
        />

        <MethodCard
          title={t('Vigilante de carpeta (casi automático)', 'Folder watcher (almost automatic)')}
          available={true}
          buttonLabel={isTauri()
            ? t('Elegir carpeta a vigilar', 'Choose folder to watch')
            : t('Disponible en la app de escritorio', 'Available in desktop app')}
          running={running === 'folder'}
          status={status.folder}
          onClick={handleFolder}
          description={t(
            `Apunta la app de escritorio a la carpeta donde ${model.software} deja los CSV. Cada archivo nuevo se analiza y sube automáticamente. Requiere instalar la versión de escritorio (Tauri).`,
            `Point the desktop app at the folder where ${model.software} drops CSVs. Each new file is parsed and uploaded automatically. Requires installing the desktop build (Tauri).`,
          )}
        />

        {/* USB / Serial live read (Web Serial API) */}
        <div id="serial" className="card p-5 mb-3 scroll-mt-20">
          <div className="flex justify-between items-baseline mb-2 gap-3">
            <h3 className="font-semibold text-base">{t('USB / Serie — lectura en vivo (recomendado para pistola con cable)', 'USB / Serial — live read (recommended for a wired gun)')}</h3>
            <span className="text-xs text-dim italic shrink-0">{t('Chrome / Edge · escritorio', 'Chrome / Edge · desktop')}</span>
          </div>
          <p className="text-sm text-muted mb-4 leading-relaxed">
            {t(
              'Conecta el Niton por su cable serie RS-232 / USB y lee las mediciones directamente aquí. En la pistola, fija el destino de salida/impresión al puerto serie y dispara una lectura. Cierra NDT / NitonConnect primero — solo un programa puede ocupar el puerto COM a la vez.',
              'Connect the Niton over its RS-232 / USB serial cable and read measurements directly here. On the gun, set the output/print destination to the serial port and trigger a reading. Close NDT / NitonConnect first — only one program can hold the COM port at a time.',
            )}
          </p>
          <div className="flex gap-3 items-center flex-wrap">
            <label className="text-xs text-dim flex items-center gap-2">
              {t('Velocidad (baudios)', 'Baud rate')}
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(parseInt(e.target.value, 10))}
                disabled={serialConnected}
                className="field !w-auto text-xs py-1"
              >
                {[9600, 19200, 38400, 57600, 115200].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            {!serialConnected ? (
              <button onClick={() => void handleSerial()} disabled={running === 'serial'} className="btn-primary text-sm">
                {running === 'serial' ? t('Conectando…', 'Connecting…') : t('Conectar puerto serie', 'Connect serial port')}
              </button>
            ) : (
              <button onClick={() => void disconnectSerial()} className="btn-ghost text-sm">{t('Desconectar', 'Disconnect')}</button>
            )}
            {serialConnected && <span className="text-xs text-emerald-300">● {t(`conectado @ ${baudRate} baudios`, `connected @ ${baudRate} baud`)}</span>}
          </div>

          {status.serial && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-xs fade-in ${
                status.serial.level === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : status.serial.level === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : status.serial.level === 'error'
                      ? 'border-red-500/40 bg-red-500/10 text-red-200'
                      : 'border-soft bg-card text-muted'
              }`}
            >
              {status.serial.message}
            </div>
          )}

          {(serialReadings.length > 0 || serialLog.length > 0) && (
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Lecturas analizadas', 'Parsed readings')}</div>
                {serialReadings.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {serialReadings.map((r) => (
                        <span key={r.element} className="chip text-xs font-mono">{r.element} {r.pct}%</span>
                      ))}
                    </div>
                    <button onClick={saveSerialReadings} className="btn-primary text-xs mt-3">{t('Guardar lecturas', 'Save readings')}</button>
                  </>
                ) : (
                  <div className="text-xs text-dim">{t('Esperando una línea de lectura reconocible…', 'Waiting for a recognisable reading line…')}</div>
                )}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Registro serie en vivo', 'Live serial log')}</div>
                <div className="rounded-lg border border-soft bg-black/30 p-2 h-32 overflow-auto font-mono text-[0.7rem] text-neutral-300 leading-relaxed">
                  {serialLog.length > 0
                    ? serialLog.map((l, i) => <div key={i}>{l}</div>)
                    : <div className="text-dim">{t('Aún no se han recibido datos.', 'No data received yet.')}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        <MethodCard
          title={t('Búsqueda Bluetooth (experimental)', 'Bluetooth scan (experimental)')}
          available={model.bluetooth}
          buttonLabel={t('Buscar dispositivos Bluetooth cercanos', 'Scan for nearby Bluetooth devices')}
          running={running === 'bluetooth'}
          status={status.bluetooth}
          onClick={handleBluetooth}
          description={t(
            `El ${model.name} se empareja por Bluetooth Classic SPP — oficialmente solo con impresoras y escáneres. El navegador puede intentar una búsqueda pero no puede leer mediciones sin el SDK de Thermo.`,
            `${model.name} pairs over Bluetooth Classic SPP — only with printers and scanners officially. The browser can attempt a scan but cannot read measurements without the Thermo SDK.`,
          )}
        />

        <MethodCard
          title={t('Wi-Fi directo (solo XL5 Plus)', 'Wi-Fi direct (only XL5 Plus)')}
          available={model.wifi}
          buttonLabel={t('Ver opciones de Wi-Fi', 'Check Wi-Fi options')}
          running={running === 'wifi'}
          status={status.wifi}
          onClick={handleWifi}
          description={
            model.wifi
              ? t(
                  'El XL5 Plus tiene Wi-Fi pero el firmware lo limita solo a la sincronización con la nube de Thermo. Sin un SDK oficial no podemos redirigirlo.',
                  'The XL5 Plus has Wi-Fi but the firmware locks it to Thermo cloud sync only. Without an official SDK we cannot redirect it.',
                )
              : t(`El ${model.name} no tiene radio Wi-Fi.`, `${model.name} has no Wi-Fi radio.`)
          }
        />
      </section>

      <section className="card p-5 text-xs text-muted space-y-2 border-l-4 border-l-accent">
        <div className="font-semibold text-neutral-200 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-bright">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {t('¿Por qué no hay Bluetooth/Wi-Fi directo desde la app?', 'Why no direct Bluetooth/Wi-Fi from the app?')}
        </div>
        <p className="leading-relaxed">
          {t(
            'Thermo Scientific no publica el protocolo para leer mediciones XRF por BT/Wi-Fi. Las radios inalámbricas del equipo portátil están reservadas para impresoras, escáneres y la propia sincronización con la nube de Thermo. Una integración personalizada requiere el SDK oficial bajo NDA, que Thermo concede solo a integradores corporativos. Las vías realistas y fiables siguen siendo la subida de CSV y el vigilante de carpetas de escritorio.',
            "Thermo Scientific does not publish the protocol for reading XRF measurements over BT/Wi-Fi. The handheld's wireless radios are reserved for printers, scanners and Thermo's own cloud sync. A custom integration requires the official SDK under NDA, which Thermo grants only to corporate integrators. The realistic and reliable paths remain CSV upload and the desktop folder watcher.",
          )}
        </p>
      </section>
    </div>
  );
}

type MethodCardProps = {
  title: string;
  available: boolean;
  description: string;
  buttonLabel: string;
  running: boolean;
  status: ConnectionStatus | null;
  onClick: () => void | Promise<void>;
  href?: string;
};

function MethodCard({
  title,
  available,
  description,
  buttonLabel,
  running,
  status,
  onClick,
  href,
}: MethodCardProps) {
  const { t } = useLang();
  const statusStyles =
    status?.level === 'success'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
      : status?.level === 'warning'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
        : status?.level === 'error'
          ? 'border-red-500/40 bg-red-500/10 text-red-200'
          : 'border-soft bg-card text-muted';

  return (
    <div className={`card p-5 mb-3 ${available ? '' : 'opacity-50'}`}>
      <div className="flex justify-between items-baseline mb-2 gap-3">
        <h3 className="font-semibold text-base">{title}</h3>
        {!available && <span className="text-xs text-dim italic shrink-0">{t('no disponible para este modelo', 'not available for this model')}</span>}
      </div>
      <p className="text-sm text-muted mb-4 leading-relaxed">{description}</p>
      <div className="flex gap-3 items-center flex-wrap">
        <button onClick={onClick} disabled={!available || running} className="btn-primary text-sm">
          {running ? t('Trabajando…', 'Working…') : buttonLabel}
        </button>
        {href && status?.level === 'success' && (
          <Link href={href} className="text-sm text-accent-bright hover:underline font-medium">
            {t('Ir a Importar →', 'Go to Import →')}
          </Link>
        )}
      </div>
      {status && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs fade-in ${statusStyles}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
