'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type NitonModel = {
  id: 'xl2' | 'xl3t' | 'xl5' | 'xl5plus';
  name: string;
  bluetooth: boolean;
  wifi: boolean;
  software: 'NDT' | 'NitonConnect';
  notes: string;
};

const NITON_MODELS: readonly NitonModel[] = [
  {
    id: 'xl2',
    name: 'Niton XL2 Precious Metals',
    bluetooth: true,
    wifi: false,
    software: 'NDT',
    notes: 'Bluetooth Classic SPP (printer/scanner only). USB-mini + RS-232.',
  },
  {
    id: 'xl3t',
    name: 'Niton XL3t / XL3 GOLDD',
    bluetooth: true,
    wifi: false,
    software: 'NDT',
    notes: 'Bluetooth Classic SPP (printer/scanner only). USB-mini + RS-232.',
  },
  {
    id: 'xl5',
    name: 'Niton XL5',
    bluetooth: true,
    wifi: false,
    software: 'NitonConnect',
    notes: 'Bluetooth Classic SPP only. USB-C.',
  },
  {
    id: 'xl5plus',
    name: 'Niton XL5 Plus / Apollo',
    bluetooth: true,
    wifi: true,
    software: 'NitonConnect',
    notes: 'Wi-Fi locked to Thermo cloud sync only — cannot point at custom endpoint without SDK.',
  },
];

type Method = 'csv' | 'folder' | 'bluetooth' | 'wifi';

type ConnectionStatus = {
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

const isTauri = (): boolean =>
  typeof window !== 'undefined' &&
  ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

const supportsWebBluetooth = (): boolean =>
  typeof navigator !== 'undefined' && 'bluetooth' in navigator;

export default function ConnectPage() {
  const [modelId, setModelId] = useState<NitonModel['id']>('xl5');
  const [status, setStatus] = useState<Record<Method, ConnectionStatus | null>>({
    csv: null,
    folder: null,
    bluetooth: null,
    wifi: null,
  });
  const [running, setRunning] = useState<Method | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('niton-model');
    if (saved && NITON_MODELS.some((m) => m.id === saved)) {
      setModelId(saved as NitonModel['id']);
    }
  }, []);

  const onPickModel = (id: NitonModel['id']) => {
    setModelId(id);
    localStorage.setItem('niton-model', id);
    setStatus({ csv: null, folder: null, bluetooth: null, wifi: null });
  };

  const model = NITON_MODELS.find((m) => m.id === modelId)!;

  const setMethodStatus = (m: Method, s: ConnectionStatus | null) =>
    setStatus((prev) => ({ ...prev, [m]: s }));

  const handleFolder = async () => {
    setRunning('folder');
    if (!isTauri()) {
      setMethodStatus('folder', {
        level: 'warning',
        message:
          'Folder watching is only available in the desktop app (Tauri). Install the desktop build to enable automatic upload from the Niton export folder.',
      });
      setRunning(null);
      return;
    }
    try {
      const tauriDialog: { open: (opts: unknown) => Promise<string | null> } =
        await import(/* webpackIgnore: true */ '@tauri-apps/plugin-dialog' as string);
      const folder = await tauriDialog.open({ directory: true, multiple: false });
      if (!folder) {
        setMethodStatus('folder', { level: 'info', message: 'Folder selection cancelled.' });
        setRunning(null);
        return;
      }
      const tauriCore: { invoke: (cmd: string, args?: unknown) => Promise<unknown> } =
        await import(/* webpackIgnore: true */ '@tauri-apps/api/core' as string);
      await tauriCore.invoke('start_niton_watcher', { folder });
      localStorage.setItem('niton-watch-folder', folder as string);
      setMethodStatus('folder', {
        level: 'success',
        message: `Watching ${folder}. New CSV files will be parsed and uploaded automatically.`,
      });
    } catch (err) {
      setMethodStatus('folder', {
        level: 'error',
        message: `Could not start watcher: ${(err as Error).message ?? err}`,
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
        message:
          'This browser does not support Web Bluetooth. Use Chrome or Edge on Windows/Android. Note: Web Bluetooth only supports BLE/GATT; the Niton speaks Bluetooth Classic SPP, so a successful pairing will not allow reading measurements without a custom SDK from Thermo.',
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
        message: `Picked "${device.name ?? device.id}". The browser cannot read measurements over Bluetooth Classic SPP — even after pairing, the Niton stream is destined for its thermal printer. To actually receive data we still need either the Thermo SDK or a custom SPP listener outside the browser.`,
      });
    } catch (err) {
      setMethodStatus('bluetooth', {
        level: 'info',
        message:
          (err as Error).name === 'NotFoundError'
            ? 'No device selected.'
            : `Bluetooth scan failed: ${(err as Error).message}`,
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
        message: `${model.name} does not have Wi-Fi. Only XL5 Plus / Apollo offer it.`,
      });
    } else {
      setMethodStatus('wifi', {
        level: 'warning',
        message:
          'XL5 Plus Wi-Fi is locked by firmware to the Thermo support portal. Without the official SDK we cannot redirect it to our own endpoint. Recommended: combine NitonConnect over LAN + a shared folder watched by the desktop app.',
      });
    }
    setRunning(null);
  };

  const handleCsv = () => {
    setMethodStatus('csv', {
      level: 'success',
      message: `Ready. In the ${model.software} software enable "Also Save CSV" and upload the file in the Import page.`,
    });
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">Connect to your Niton XL</h1>
        <p className="text-muted text-sm">
          Pick your exact model and the app will offer the connection methods that are actually
          available for it. We are transparent about what works and what does not.
        </p>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-soft text-accent-bright text-xs font-bold">1</span>
          <h2 className="text-lg font-semibold">Your Niton model</h2>
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
                {modelId === m.id && <span className="text-accent-bright text-xs">● selected</span>}
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className={`chip ${!m.bluetooth ? 'opacity-40' : ''}`}>{m.bluetooth ? 'BT' : 'no BT'}</span>
                <span className={`chip ${!m.wifi ? 'opacity-40' : ''}`}>{m.wifi ? 'Wi-Fi' : 'no Wi-Fi'}</span>
                <span className="chip">{m.software}</span>
              </div>
              <div className="text-xs text-muted mt-3 leading-relaxed">{m.notes}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-soft text-accent-bright text-xs font-bold">2</span>
          <h2 className="text-lg font-semibold">Connection method</h2>
        </div>

        <MethodCard
          title="CSV upload (recommended, always works)"
          available={true}
          buttonLabel="Mark ready & open Import"
          running={running === 'csv'}
          status={status.csv}
          onClick={handleCsv}
          description={`Enable "Also Save CSV" in ${model.software}, then upload the file in the Import page. Works for every model.`}
          href="/import"
        />

        <MethodCard
          title="Folder watcher (almost automatic)"
          available={true}
          buttonLabel={isTauri() ? 'Choose folder to watch' : 'Available in desktop app'}
          running={running === 'folder'}
          status={status.folder}
          onClick={handleFolder}
          description={`Point the desktop app at the folder where ${model.software} drops CSVs. Each new file is parsed and uploaded automatically. Requires installing the desktop build (Tauri).`}
        />

        <MethodCard
          title="Bluetooth scan (experimental)"
          available={model.bluetooth}
          buttonLabel="Scan for nearby Bluetooth devices"
          running={running === 'bluetooth'}
          status={status.bluetooth}
          onClick={handleBluetooth}
          description={`${model.name} pairs over Bluetooth Classic SPP — only with printers and scanners officially. The browser can attempt a scan but cannot read measurements without the Thermo SDK.`}
        />

        <MethodCard
          title="Wi-Fi direct (only XL5 Plus)"
          available={model.wifi}
          buttonLabel="Check Wi-Fi options"
          running={running === 'wifi'}
          status={status.wifi}
          onClick={handleWifi}
          description={
            model.wifi
              ? 'The XL5 Plus has Wi-Fi but the firmware locks it to Thermo cloud sync only. Without an official SDK we cannot redirect it.'
              : `${model.name} has no Wi-Fi radio.`
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
          Why no direct Bluetooth/Wi-Fi from the app?
        </div>
        <p className="leading-relaxed">
          Thermo Scientific does not publish the protocol for reading XRF measurements over BT/Wi-Fi.
          The handheld's wireless radios are reserved for printers, scanners and Thermo's own cloud sync.
          A custom integration requires the official SDK under NDA, which Thermo grants only to corporate
          integrators. The realistic and reliable paths remain CSV upload and the desktop folder watcher.
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
        {!available && <span className="text-xs text-dim italic shrink-0">not available for this model</span>}
      </div>
      <p className="text-sm text-muted mb-4 leading-relaxed">{description}</p>
      <div className="flex gap-3 items-center flex-wrap">
        <button onClick={onClick} disabled={!available || running} className="btn-primary text-sm">
          {running ? 'Working…' : buttonLabel}
        </button>
        {href && status?.level === 'success' && (
          <Link href={href} className="text-sm text-accent-bright hover:underline font-medium">
            Go to Import →
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
