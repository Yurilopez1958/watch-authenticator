'use client';

import { useEffect, useState } from 'react';

// Compliance / conflict-of-interest filter.
// The business marks the brands it officially represents (authorized dealer /
// distributor). Each represented brand carries a rule: 'warn' shows an internal
// alert; 'block' restricts authenticating/registering that brand. Stored locally.

export type BrandRule = 'warn' | 'block';
export type ComplianceConfig = { rules: Record<string, BrandRule> };

const KEY = 'compliance-represented-brands';
const DEFAULT: ComplianceConfig = { rules: {} };
const CHANGED_EVENT = 'compliance-changed';

export function getCompliance(): ComplianceConfig {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<ComplianceConfig>;
    const rules: Record<string, BrandRule> = {};
    if (parsed.rules && typeof parsed.rules === 'object') {
      for (const [id, rule] of Object.entries(parsed.rules)) {
        if (rule === 'warn' || rule === 'block') rules[id] = rule;
      }
    }
    return { rules };
  } catch {
    return DEFAULT;
  }
}

export function saveCompliance(cfg: ComplianceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch (e) {
    console.warn('Could not save compliance settings:', (e as Error).message);
  }
}

/** Returns the rule for a brand, or null if it is not represented. */
export function ruleFor(brandId: string, cfg: ComplianceConfig): BrandRule | null {
  return cfg.rules[brandId] ?? null;
}

/** React hook: current compliance config + updater, reactive across the tab.
 *  `ready` is false until the stored config has loaded — gate restricted actions
 *  on it so a "block" rule is enforced even on the first render. */
export function useCompliance(): {
  config: ComplianceConfig;
  ready: boolean;
  update: (cfg: ComplianceConfig) => void;
} {
  const [config, setConfig] = useState<ComplianceConfig>(DEFAULT);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setConfig(getCompliance());
    setReady(true);
    const handler = () => setConfig(getCompliance());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  const update = (next: ComplianceConfig) => {
    saveCompliance(next);
    setConfig(next);
  };
  return { config, ready, update };
}
