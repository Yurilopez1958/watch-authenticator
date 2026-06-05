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

function splitCsvLine(line: string): string[] {
  // Maneja comillas dobles y comas dentro de comillas
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function isErrorColumn(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith(' err') || n.endsWith('_err') || n === 'err';
}

function asElement(name: string): ElementSymbol | null {
  const trimmed = name.trim();
  return KNOWN_ELEMENTS.has(trimmed as ElementSymbol) ? (trimmed as ElementSymbol) : null;
}

function parseNumber(raw: string): number | null {
  if (raw == null) return null;
  const cleaned = raw.replace(/[%\s]/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '<LOD' || cleaned === '---') return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function buildTimestamp(date: string | undefined, time: string | undefined): string {
  if (!date) return new Date().toISOString();
  const t = time ?? '00:00:00';
  // Intenta formatos comunes: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
  const iso = Date.parse(`${date} ${t}`);
  if (Number.isFinite(iso)) return new Date(iso).toISOString();
  const parts = date.split(/[/-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts as [string, string, string];
    const year = c.length === 4 ? c : a.length === 4 ? a : `20${c}`;
    const month = c.length === 4 ? a : b;
    const day = c.length === 4 ? b : a.length === 4 ? c : b;
    const candidate = Date.parse(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${t}`);
    if (Number.isFinite(candidate)) return new Date(candidate).toISOString();
  }
  return new Date().toISOString();
}

/**
 * Parsea un texto CSV completo exportado por el software oficial del Niton XL.
 * Tolera cabeceras en cualquier orden y filas con campos faltantes.
 */
export function parseNitonCsv(csvText: string): NitonImportResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], unrecognizedColumns: [], warnings: ['Empty CSV or missing headers.'] };
  }

  const headers = splitCsvLine(lines[0]!);
  const unrecognized: string[] = [];
  const warnings: string[] = [];

  type ElementCol = { element: ElementSymbol; valueIdx: number; errorIdx?: number };
  const elementColumns: ElementCol[] = [];

  const colIdx: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().trim();
    colIdx[key] = i;
  });

  // Detectar columnas de elementos: si h es un símbolo conocido y la siguiente
  // (o cualquier columna llamada "{el} Err") es su error, los emparejamos.
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]!;
    if (isErrorColumn(h)) continue;
    const el = asElement(h);
    if (!el) {
      if (!['reading #', 'reading', 'date', 'time', 'duration', 'mode', 'sample id', 'operator', 'notes', 'type'].includes(h.toLowerCase())) {
        if (!h.toLowerCase().includes(' err')) unrecognized.push(h);
      }
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
      ...(errorIdx !== undefined && { errorIdx }),
    });
  }

  if (elementColumns.length === 0) {
    warnings.push('No chemical element column detected.');
  }

  const get = (cells: string[], key: string): string | undefined => {
    const idx = colIdx[key];
    return idx !== undefined ? cells[idx] : undefined;
  };

  const rows: NitonImportRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r]!);
    if (cells.length < 2) continue;

    const date = get(cells, 'date');
    const time = get(cells, 'time');
    const readings: ElementReading[] = [];
    for (const ec of elementColumns) {
      const raw = cells[ec.valueIdx];
      if (raw === undefined) continue;
      const pct = parseNumber(raw);
      if (pct === null || pct <= 0) continue;
      const errorPct = ec.errorIdx !== undefined ? parseNumber(cells[ec.errorIdx] ?? '') : null;
      readings.push({
        element: ec.element,
        pct,
        ...(errorPct !== null ? { errorPct } : {}),
      });
    }
    if (readings.length === 0) continue;

    const durationRaw = get(cells, 'duration');
    const duration = durationRaw ? parseNumber(durationRaw) : null;
    const readingNumber = get(cells, 'reading #') ?? get(cells, 'reading');
    const mode = get(cells, 'mode') ?? get(cells, 'type');
    const sampleId = get(cells, 'sample id');
    const operator = get(cells, 'operator');
    const notes = get(cells, 'notes');
    rows.push({
      measuredAt: buildTimestamp(date, time),
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

  if (rows.length === 0) warnings.push('No valid row found in the CSV.');

  return { rows, unrecognizedColumns: unrecognized, warnings };
}
