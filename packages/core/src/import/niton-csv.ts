import type {
  ElementReading,
  ElementSymbol,
  XRFMeasurement,
  WatchPart,
} from '../types/index';

/**
 * Parser for CSVs exported by NDT (Niton Data Transfer) and NitonConnect with the
 * "Also Save CSV" option enabled.
 *
 * Typical structure:
 *   Reading #,Date,Time,Duration,Mode,Sample ID,Operator,Notes,Au,Au Err,Ag,Ag Err,Cu,...
 *   1,2026-05-28,14:30:25,30.5,Precious Metals,SubmDate-001,Yuri,Case back,75.2,0.3,12.5,0.4,...
 *
 * Element columns come in pairs: symbol + " Err" (1σ or 2σ). The parser ignores
 * unknown headers and extracts every Element/Err pair detected.
 */

const KNOWN_ELEMENTS: ReadonlySet<ElementSymbol> = new Set<ElementSymbol>([
  'Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si', 'C', 'S', 'P', 'N',
  'Au', 'Ag', 'Pt', 'Pd', 'Ru', 'Rh', 'Ir',
  'Ti', 'Zn', 'Sn', 'Co', 'Al', 'W', 'Nb',
]);

/** RFC4122-ish id. Uses crypto.randomUUID when present (browsers / Node 19+),
 *  else falls back to getRandomValues, else Math.random — so import never throws
 *  on an older Safari or a non-secure context. */
function makeId(): string {
  const c: Crypto | undefined =
    typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type NitonImportRow = {
  readingNumber?: string;
  date?: string;
  time?: string;
  durationSec?: number;
  mode?: string;
  sampleId?: string;
  operator?: string;
  notes?: string;
  measuredAt: string;
  /** Concentration unit the source row used; values in `readings.pct` are always % */
  units?: 'percent' | 'ppm';
  readings: ElementReading[];
};

export type NitonImportResult = {
  rows: NitonImportRow[];
  unrecognizedColumns: string[];
  warnings: string[];
};

/** Convierte una fila del CSV en un XRFMeasurement listo para insertar. */
export function rowToMeasurement(
  row: NitonImportRow,
  options: { watchId?: string; partMeasured?: WatchPart } = {},
): XRFMeasurement {
  return {
    id: makeId(),
    partMeasured: options.partMeasured ?? 'case-back',
    measuredAt: row.measuredAt,
    instrument: 'niton-xl',
    readings: row.readings,
    ...(options.watchId !== undefined && { watchId: options.watchId }),
    ...(row.readingNumber !== undefined && { serialReading: row.readingNumber }),
    ...(row.notes !== undefined && { notes: row.notes }),
  };
}

const PPM_PER_PERCENT = 10_000; // 1 wt% = 10,000 ppm
const MAX_INPUT_CHARS = 8_000_000; // ~8 MB guard against pathological input
const MAX_RECORDS = 10_000; // cap rows processed

/**
 * Splits raw CSV text into records (each an array of fields), RFC-4180 style:
 * honours double-quoted fields that contain commas, escaped quotes ("") and
 * EMBEDDED NEWLINES — the old line-by-line split corrupted any Notes field that
 * wrapped across lines. Strips a leading UTF-8 BOM. Skips blank records.
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; // strip BOM
  const n = text.length;

  const endField = () => { record.push(field); field = ''; };
  const endRecord = () => { endField(); records.push(record); record = []; };

  for (; i < n; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else {
        field += ch; // newlines inside quotes are kept verbatim
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      endField();
    } else if (ch === '\n') {
      endRecord();
    } else if (ch === '\r') {
      endRecord();
      if (text[i + 1] === '\n') i++; // CRLF
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || record.length > 0) endRecord(); // flush trailing

  return records.filter((rec) => rec.some((f) => f.trim().length > 0));
}

function isErrorColumn(name: string): boolean {
  const n = name.toLowerCase().trim();
  return n.endsWith(' err') || n.endsWith('_err') || n.endsWith(' error') || n === 'err';
}

/** Maps a header like "Fe", "Fe (%)", "Cu ppm" to a known element symbol. The
 *  unit/parenthetical is stripped, then an EXACT symbol match is required so
 *  meta columns such as "Mode" never collapse to "Mo". */
function asElement(name: string): ElementSymbol | null {
  const cleaned = name
    .replace(/\s*\([^)]*\)\s*$/, '') // trailing "(...)"
    .replace(/\s+(ppm|%|wt\.?%?|conc\.?|concentration)\.?$/i, '') // trailing unit word
    .trim();
  return KNOWN_ELEMENTS.has(cleaned as ElementSymbol) ? (cleaned as ElementSymbol) : null;
}

/** Detects the unit declared in a column HEADER, if any. */
function unitFromHeader(name: string): 'ppm' | 'percent' | null {
  if (/\bppm\b/i.test(name)) return 'ppm';
  if (/%|wt\.?%/i.test(name)) return 'percent';
  return null;
}

/** Detects the unit declared in a "Units" CELL value, if any. */
function unitFromCell(v: string | undefined): 'ppm' | 'percent' | null {
  if (!v) return null;
  if (/ppm/i.test(v)) return 'ppm';
  if (/%|percent/i.test(v)) return 'percent';
  return null;
}

/** Parses a Niton numeric cell. Accepts comma decimals and thousands, "%",
 *  and treats below-detection markers (<LOD, ---, N/A, BDL) as null. */
function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  let s = raw.trim().replace(/%/g, '').replace(/\s+/g, '');
  if (s === '' || /^<?lod$/i.test(s) || s === '---' || /^n\/?a$/i.test(s) || /^bdl$/i.test(s)) {
    return null;
  }
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, ''); // 12,345.6 → thousands
  else if (s.includes(',')) s = s.replace(',', '.'); // 9,73 → decimal comma
  const num = Number.parseFloat(s);
  return Number.isFinite(num) ? num : null;
}

type DateResult = { iso: string; ambiguous: boolean } | null;

/** Builds a UTC ISO timestamp from numeric Y/M/D + a time string, validating
 *  ranges and rejecting rollovers (e.g. 31 April). */
function buildIso(year: number, month: number, day: number, t: string): DateResult {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const [hh = 0, mm = 0, ss = 0] = t.split(':').map((x) => Number.parseInt(x, 10) || 0);
  const ms = Date.UTC(year, month - 1, day, hh, mm, ss);
  const dt = new Date(ms);
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null; // invalid calendar date
  }
  return { iso: dt.toISOString(), ambiguous: false };
}

/** Normalises a time field to "HH:MM:SS"; defaults to midnight when absent/odd. */
function normTime(time: string | undefined): string {
  const t = (time ?? '').trim();
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{1,2}:\d{2}$/.test(t)) return `${t}:00`;
  return '00:00:00';
}

/**
 * Parses a Niton date string without the engine-dependent `Date.parse`. ISO
 * (YYYY-MM-DD) is unambiguous. For slash/dot/dash dates it resolves MM/DD vs
 * DD/MM when one value is > 12; when both are ≤ 12 it assumes MM/DD (the Niton
 * US factory default) and flags the result as ambiguous.
 */
function parseNitonDate(date: string | undefined, time: string | undefined): DateResult {
  if (!date || !date.trim()) return null;
  const t = normTime(time);
  const d = date.trim();

  // ISO: YYYY-MM-DD
  let m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return buildIso(+m[1]!, +m[2]!, +m[3]!, t);

  // Separated by / . or - with a 4-digit year first: YYYY/MM/DD
  m = d.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
  if (m) return buildIso(+m[1]!, +m[2]!, +m[3]!, t);

  // a/b/c (c is the year: 4-digit, or 2-digit → 20xx)
  m = d.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (m) {
    const a = +m[1]!, b = +m[2]!;
    const year = m[3]!.length === 4 ? +m[3]! : 2000 + +m[3]!;
    let month: number, day: number, ambiguous = false;
    if (a > 12 && b <= 12) { day = a; month = b; }       // DD/MM
    else if (b > 12 && a <= 12) { month = a; day = b; }  // MM/DD
    else { month = a; day = b; ambiguous = a <= 12 && b <= 12; } // assume MM/DD
    const res = buildIso(year, month, day, t);
    return res ? { iso: res.iso, ambiguous } : null;
  }
  return null;
}

const META_KEYS = new Set([
  'reading #', 'reading', 'reading no', 'reading number', 'date', 'time', 'duration',
  'mode', 'type', 'sample id', 'sample', 'operator', 'notes', 'note', 'units', 'unit',
]);

/**
 * Parses a full CSV exported by the Niton XL official software (NDT / NitonConnect).
 * Tolerant of header order and missing fields. Converts ppm readings to weight-%
 * so verdicts are never computed against a 700,000% iron reading.
 */
export function parseNitonCsv(csvText: string): NitonImportResult {
  const warnings: string[] = [];
  if (typeof csvText !== 'string' || csvText.trim().length === 0) {
    return { rows: [], unrecognizedColumns: [], warnings: ['Empty CSV or missing headers.'] };
  }
  let text = csvText;
  if (text.length > MAX_INPUT_CHARS) {
    text = text.slice(0, MAX_INPUT_CHARS);
    warnings.push('CSV was very large and was truncated; some rows may be missing.');
  }

  const records = parseCsvRecords(text);
  if (records.length < 2) {
    return { rows: [], unrecognizedColumns: [], warnings: ['Empty CSV or missing headers.'] };
  }

  const headers = records[0]!.map((h) => h.trim());
  const unrecognized: string[] = [];

  const colIdx: Record<string, number> = {};
  headers.forEach((h, i) => { colIdx[h.toLowerCase()] = i; });
  const unitsColIdx = colIdx['units'] ?? colIdx['unit'];

  type ElementCol = { element: ElementSymbol; valueIdx: number; errorIdx?: number; unit: 'ppm' | 'percent' | null };
  const elementColumns: ElementCol[] = [];

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]!;
    if (isErrorColumn(h)) continue;
    const el = asElement(h);
    if (!el) {
      const key = h.toLowerCase();
      if (key && !META_KEYS.has(key) && !key.includes('err')) unrecognized.push(h);
      continue;
    }
    let errorIdx: number | undefined;
    const next = headers[i + 1];
    if (next && isErrorColumn(next)) errorIdx = i + 1;
    else {
      const explicit = colIdx[`${el.toLowerCase()} err`] ?? colIdx[`${el.toLowerCase()}_err`];
      if (explicit !== undefined) errorIdx = explicit;
    }
    elementColumns.push({
      element: el,
      valueIdx: i,
      unit: unitFromHeader(h),
      ...(errorIdx !== undefined && { errorIdx }),
    });
  }

  if (elementColumns.length === 0) warnings.push('No chemical element column detected.');

  const get = (cells: string[], key: string): string | undefined => {
    const idx = colIdx[key];
    return idx !== undefined ? cells[idx] : undefined;
  };

  let ppmConverted = false;
  let ambiguousDate = false;
  let badDate = false;

  const rows: NitonImportRow[] = [];
  const limit = Math.min(records.length, MAX_RECORDS + 1);
  for (let r = 1; r < limit; r++) {
    const cells = records[r]!;
    if (cells.length < 2) continue;

    // Collect raw numeric values first so we can detect the row's unit.
    const raws: { ec: ElementCol; value: number; error: number | null }[] = [];
    for (const ec of elementColumns) {
      const value = parseNumber(cells[ec.valueIdx]);
      if (value === null || value <= 0) continue;
      const error = ec.errorIdx !== undefined ? parseNumber(cells[ec.errorIdx]) : null;
      raws.push({ ec, value, error });
    }
    if (raws.length === 0) continue;

    // Unit is decided PER COLUMN. A column whose header declares the unit
    // (e.g. "Cu ppm") is trusted individually. Columns without a declared unit
    // share a row-level unit from the "Units" cell, or — failing that — a
    // heuristic over those same columns (a weight-% reading can never exceed
    // 100, so any value > 100 means the figure is in ppm).
    const cellUnit = unitsColIdx !== undefined ? unitFromCell(cells[unitsColIdx]) : null;
    const undeclared = raws.filter((x) => !x.ec.unit);
    const heuristicPpm = undeclared.some((x) => x.value > 100.5);
    const rowUnit: 'ppm' | 'percent' = cellUnit ?? (heuristicPpm ? 'ppm' : 'percent');

    let rowHadPpm = false;
    const readings: ElementReading[] = [];
    for (const { ec, value, error } of raws) {
      const unit = ec.unit ?? rowUnit;
      const factor = unit === 'ppm' ? 1 / PPM_PER_PERCENT : 1;
      const pct = value * factor;
      if (pct <= 0 || pct > 100.5) continue; // drop impossible concentrations
      if (unit === 'ppm') { rowHadPpm = true; ppmConverted = true; }
      readings.push({
        element: ec.element,
        pct,
        ...(error !== null ? { errorPct: error * factor } : {}),
      });
    }
    if (readings.length === 0) continue;

    const date = get(cells, 'date');
    const time = get(cells, 'time');
    const parsedDate = parseNitonDate(date, time);
    if (parsedDate?.ambiguous) ambiguousDate = true;
    if (date && !parsedDate) badDate = true;
    const measuredAt = parsedDate?.iso ?? new Date().toISOString();

    const durationRaw = get(cells, 'duration');
    const duration = durationRaw ? parseNumber(durationRaw) : null;
    const readingNumber = get(cells, 'reading #') ?? get(cells, 'reading');
    const mode = get(cells, 'mode') ?? get(cells, 'type');
    const sampleId = get(cells, 'sample id') ?? get(cells, 'sample');
    const operator = get(cells, 'operator');
    const notes = get(cells, 'notes') ?? get(cells, 'note');
    rows.push({
      measuredAt,
      units: rowHadPpm ? 'ppm' : 'percent',
      readings,
      ...(readingNumber !== undefined && { readingNumber }),
      ...(date !== undefined && { date }),
      ...(time !== undefined && { time }),
      ...(duration !== null && { durationSec: duration }),
      ...(mode !== undefined && { mode }),
      ...(sampleId !== undefined && { sampleId }),
      ...(operator !== undefined && { operator }),
      ...(notes !== undefined && { notes }),
    });
  }

  if (records.length - 1 > MAX_RECORDS) {
    warnings.push(`Only the first ${MAX_RECORDS} readings were imported.`);
  }
  if (ppmConverted) warnings.push('Detected ppm readings; converted to weight-% for matching.');
  if (ambiguousDate) warnings.push('Some dates were ambiguous (MM/DD vs DD/MM); assumed MM/DD/YYYY. Verify if needed.');
  if (badDate) warnings.push('Some dates could not be parsed; import time was used for those rows.');
  if (rows.length === 0) warnings.push('No valid row found in the CSV.');

  return { rows, unrecognizedColumns: unrecognized, warnings };
}
