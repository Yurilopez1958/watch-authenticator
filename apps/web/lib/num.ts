// Locale-aware number parsing. Spanish-locale users type a comma as the decimal
// separator ("9,73"), which the native parseFloat reads as 9 (truncating at the
// comma). These helpers accept both "9,73" and "9.73".

/** Parses a decimal from user text, accepting a comma OR a dot as the decimal
 *  separator. Returns NaN when the text holds no number. */
export function parseDecimal(raw: string): number {
  if (typeof raw !== 'string') return Number.NaN;
  const s = raw.trim().replace(/\s+/g, '');
  if (!s) return Number.NaN;
  // Comma but no dot → comma is the decimal separator ("9,73" → "9.73").
  // Both present → dot is decimal, commas are thousands separators.
  const normalized =
    s.includes(',') && !s.includes('.') ? s.replace(',', '.') : s.replace(/,/g, '');
  return Number.parseFloat(normalized);
}

/** Like parseDecimal but returns 0 instead of NaN (for sums / form fields). */
export function parseDecimalOr0(raw: string): number {
  const n = parseDecimal(raw);
  return Number.isFinite(n) ? n : 0;
}
