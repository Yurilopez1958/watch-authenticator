'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ALL_BRANDS } from '@watch-auth/core';
import { useLang } from '@/lib/i18n';
import { parseDecimal } from '@/lib/num';
import {
  getBrandExpenses, saveBrandExpenses, computeBrandPricing,
  hasPin, setPin, verifyPin, makeExpenseId, type ExpenseItem,
} from '@/lib/brand-expenses';

/**
 * Admin submenu (PIN-gated) to configure per-brand expense percentages.
 * Portaled to <body> so the header's backdrop-filter can't clamp the overlay.
 */
export function AdminExpenses({ open, onClose, initialBrandId }: {
  open: boolean;
  onClose: () => void;
  initialBrandId?: string;
}) {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── PIN gate ──
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const creating = !hasPin();

  // ── Editor ──
  const [brandId, setBrandId] = useState(initialBrandId ?? ALL_BRANDS[0]!.id);
  const [rows, setRows] = useState<ExpenseItem[]>([]);
  const [previewBase, setPreviewBase] = useState(10000);
  const [savedFlash, setSavedFlash] = useState(false);

  // Reset transient state each time the panel opens.
  useEffect(() => {
    if (!open) return;
    setUnlocked(false); setPinInput(''); setPin2(''); setPinError(null);
    setBrandId(initialBrandId ?? ALL_BRANDS[0]!.id);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, initialBrandId, onClose]);

  // Load the brand's saved rows whenever brand changes (once unlocked).
  useEffect(() => { if (unlocked) setRows(getBrandExpenses(brandId)); }, [unlocked, brandId]);

  if (!open || !mounted) return null;

  const submitPin = () => {
    if (creating) {
      if (!/^\d{4,8}$/.test(pinInput)) { setPinError(t('El PIN debe tener 4-8 dígitos.', 'PIN must be 4–8 digits.')); return; }
      if (pinInput !== pin2) { setPinError(t('Los PIN no coinciden.', 'PINs do not match.')); return; }
      setPin(pinInput); setUnlocked(true); setPinError(null);
    } else {
      if (verifyPin(pinInput)) { setUnlocked(true); setPinError(null); }
      else setPinError(t('PIN incorrecto.', 'Wrong PIN.'));
    }
  };

  // ── Row helpers ──
  const addRow = () => setRows((r) => [...r, { id: makeExpenseId(), label: '', percent: 0, active: true }]);
  const updateRow = (id: string, patch: Partial<ExpenseItem>) =>
    setRows((r) => r.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeRow = (id: string) => setRows((r) => r.filter((it) => it.id !== id));

  const hasInvalid = rows.some((r) => r.label.trim() === '' || !Number.isFinite(r.percent) || r.percent < 0);
  const preview = computeBrandPricing(previewBase, rows);

  const doSave = () => {
    saveBrandExpenses(brandId, rows);
    setRows(getBrandExpenses(brandId)); // reflect sanitisation (drops empty labels)
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-2xl bg-card border border-soft rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[88dvh] overflow-y-auto fade-in"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-3"><div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--border-hover)' }} /></div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-soft text-accent-bright shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              </span>
              <h2 className="text-xl font-bold leading-tight">{t('Administración · Gastos por marca', 'Admin · Brand expenses')}</h2>
            </div>
            <button onClick={onClose} aria-label={t('Cerrar', 'Close')} className="shrink-0 w-9 h-9 rounded-lg border border-soft hover:border-accent transition-colors inline-flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {!unlocked ? (
            // ── PIN gate ──
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-muted">
                {creating
                  ? t('Crea un PIN de administrador (4-8 dígitos) para proteger esta sección. Se guarda solo en este dispositivo.', 'Create an admin PIN (4–8 digits) to protect this section. Stored on this device only.')
                  : t('Introduce el PIN de administrador.', 'Enter the admin PIN.')}
              </p>
              <input
                type="password" inputMode="numeric" autoFocus
                value={pinInput} onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !creating) submitPin(); }}
                placeholder={t('PIN', 'PIN')} className="field font-mono tracking-widest"
              />
              {creating && (
                <input
                  type="password" inputMode="numeric"
                  value={pin2} onChange={(e) => setPin2(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitPin(); }}
                  placeholder={t('Repite el PIN', 'Repeat the PIN')} className="field font-mono tracking-widest"
                />
              )}
              {pinError && <div className="text-sm text-red-300">{pinError}</div>}
              <button onClick={submitPin} className="btn-primary w-full">{creating ? t('Crear PIN y entrar', 'Create PIN & enter') : t('Entrar', 'Unlock')}</button>
            </div>
          ) : (
            // ── Editor ──
            <div className="space-y-5">
              <div>
                <div className="text-xs uppercase tracking-wide text-dim mb-2">{t('Marca', 'Brand')}</div>
                <div className="flex flex-wrap gap-2">
                  {ALL_BRANDS.map((b) => (
                    <button key={b.id} onClick={() => setBrandId(b.id)} className={`chip cursor-pointer ${brandId === b.id ? '!bg-accent !text-white !border-transparent' : ''}`}>{b.name}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_5.5rem_auto_auto] gap-2 text-[0.65rem] uppercase tracking-wide text-dim px-1">
                  <span>{t('Concepto', 'Label')}</span><span>{t('Porcentaje', 'Percent')}</span><span className="text-center">{t('Activo', 'Active')}</span><span />
                </div>
                {rows.length === 0 && <div className="text-sm text-dim px-1">{t('No hay gastos para esta marca. Añade uno.', 'No expenses for this brand. Add one.')}</div>}
                {rows.map((r) => {
                  const bad = r.label.trim() === '' || !Number.isFinite(r.percent) || r.percent < 0;
                  return (
                    <div key={r.id} className="grid grid-cols-[1fr_5.5rem_auto_auto] gap-2 items-center">
                      <input
                        value={r.label} onChange={(e) => updateRow(r.id, { label: e.target.value })}
                        placeholder={t('p. ej. Transporte', 'e.g. Transport')}
                        className={`field text-sm py-1.5 ${r.label.trim() === '' ? '!border-red-500/50' : ''}`}
                      />
                      <input
                        type="text" inputMode="decimal"
                        value={String(r.percent)}
                        onChange={(e) => { const n = parseDecimal(e.target.value); updateRow(r.id, { percent: Number.isFinite(n) ? n : 0 }); }}
                        className={`field text-sm py-1.5 text-right font-mono ${bad && r.label.trim() !== '' ? '!border-red-500/50' : ''}`}
                      />
                      <label className="inline-flex justify-center px-1">
                        <input type="checkbox" checked={r.active} onChange={(e) => updateRow(r.id, { active: e.target.checked })} className="w-4 h-4 accent-[var(--accent)]" />
                      </label>
                      <button onClick={() => removeRow(r.id)} aria-label={t('Eliminar', 'Delete')} className="w-8 h-8 rounded-lg border border-soft text-red-300 hover:border-red-500/60 inline-flex items-center justify-center">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  );
                })}
                <button onClick={addRow} className="btn-ghost text-sm inline-flex items-center gap-1.5 mt-1">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  {t('Añadir gasto', 'Add expense')}
                </button>
              </div>

              {/* Live preview + validation */}
              <div className="rounded-lg border border-soft bg-card p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-dim">{t('Precio base de prueba', 'Preview base price')}</span>
                  <input type="text" inputMode="decimal" value={String(previewBase)} onChange={(e) => setPreviewBase(parseDecimal(e.target.value) || 0)} className="field text-sm py-1 w-28 text-right font-mono" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div><div className="text-[0.65rem] uppercase text-dim">{t('Gastos', 'Expenses')}</div><div className="font-mono font-bold">{preview.sumPct.toFixed(1)}%</div></div>
                  <div><div className="text-[0.65rem] uppercase text-dim">{t('Precio de compra', 'Purchase price')}</div><div className="font-mono font-bold text-emerald-300">{preview.purchase.toLocaleString()}</div></div>
                  <div><div className="text-[0.65rem] uppercase text-dim">{t('Coste total', 'Total cost')}</div><div className="font-mono font-bold text-amber-300">{preview.totalCost.toLocaleString()}</div></div>
                </div>
                {preview.over100 && <div className="text-xs text-red-300">{t('⚠ Los gastos suman ≥ 100%: el precio de compra sería 0 o negativo.', '⚠ Expenses total ≥ 100%: purchase price would be 0 or negative.')}</div>}
                {hasInvalid && <div className="text-xs text-amber-300">{t('Hay filas sin concepto o con porcentaje inválido; se ignorarán al guardar.', 'Some rows have no label or an invalid percent; they will be ignored on save.')}</div>}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={doSave} className="btn-primary text-sm">{t('Guardar', 'Save')}</button>
                {savedFlash && <span className="text-xs text-emerald-300">✓ {t('Guardado', 'Saved')}</span>}
                <button onClick={() => { setUnlocked(false); setPinInput(''); setPin2(''); }} className="btn-ghost text-sm ml-auto">{t('Bloquear', 'Lock')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
