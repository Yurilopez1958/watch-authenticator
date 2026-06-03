import Anthropic from '@anthropic-ai/sdk';
import type { ElementReading, ElementSymbol } from '../types/index';

const KNOWN_ELEMENTS: ReadonlySet<string> = new Set<ElementSymbol>([
  'Fe', 'Cr', 'Ni', 'Mo', 'Mn', 'Cu', 'Si', 'C', 'S', 'P', 'N',
  'Au', 'Ag', 'Pt', 'Pd', 'Ru', 'Rh', 'Ir',
  'Ti', 'Zn', 'Sn', 'Co', 'Al', 'W', 'Nb',
]);

export type XrfOcrResult = {
  readings: ElementReading[];
  /** Free-text notes about the read (e.g. mode shown, units, confidence). */
  notes: string;
  /** Raw model output for debugging. */
  raw: string;
};

const SYSTEM_PROMPT = `You read the screen of a Thermo Scientific Niton XL handheld XRF analyzer from a photo. \
The screen lists chemical elements with their measured concentration. Concentrations may be shown as \
percentages (%) or in ppm. Your job is to transcribe each element and its percentage value accurately. \
Convert ppm to percent (divide by 10000) when the screen uses ppm. Ignore the ± error figures unless \
asked. Only report elements you can read with confidence. Respond in English.`;

function buildContent(imageBase64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp'): Anthropic.Messages.ContentBlockParam[] {
  return [
    {
      type: 'text',
      text: `Read this Niton XL screen and transcribe the elemental composition.`,
    },
    {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: imageBase64 },
    },
    {
      type: 'text',
      text: `Respond ONLY with a valid JSON object, no extra text or code fences, with this structure:
{
  "readings": [ { "element": "Fe", "pct": 46.2 }, { "element": "Cr", "pct": 21.1 } ],
  "notes": "short note: what mode the screen shows, whether values were % or ppm, any uncertainty"
}
Use the standard chemical symbol for each element (Fe, Cr, Ni, Mo, Mn, Cu, Si, Au, Ag, Pt, Pd, Ru, Rh, Ir, Ti, Zn, etc.).
"pct" must be a number in percent (0–100). If the screen shows ppm, convert to percent.`,
    },
  ];
}

function parse(text: string): { readings: ElementReading[]; notes: string } {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error(`No JSON in model response: ${trimmed.slice(0, 200)}`);
  }
  const parsed = JSON.parse(trimmed.slice(start, end + 1)) as {
    readings?: { element?: string; pct?: number }[];
    notes?: string;
  };
  const readings: ElementReading[] = [];
  for (const r of parsed.readings ?? []) {
    const el = (r.element ?? '').trim();
    if (!KNOWN_ELEMENTS.has(el)) continue;
    const pct = typeof r.pct === 'number' ? r.pct : parseFloat(String(r.pct));
    if (!Number.isFinite(pct) || pct <= 0) continue;
    readings.push({ element: el as ElementSymbol, pct });
  }
  return { readings, notes: parsed.notes ?? '' };
}

/**
 * Resolves a usable vision-capable model for this account. If an explicit model
 * is given, use it. Otherwise ask the API which models are available and pick a
 * sensible one (prefer Sonnet for speed/cost, then Opus, then anything). This
 * keeps the feature working even as Anthropic renames or retires models.
 */
async function resolveModel(client: Anthropic, preferred?: string): Promise<string> {
  if (preferred) return preferred;
  const list = await client.models.list({ limit: 50 });
  const ids = list.data.map((m) => m.id);
  // All Claude 3+ models are vision-capable. Prefer a recent Sonnet.
  const sonnet = ids.find((id) => id.includes('sonnet'));
  const opus = ids.find((id) => id.includes('opus'));
  const chosen = sonnet ?? opus ?? ids[0];
  if (!chosen) throw new Error('No models available for this API key.');
  return chosen;
}

/**
 * Reads a photo of the Niton XL screen with Claude Vision and extracts the
 * elemental composition as structured readings.
 */
export async function extractXrfFromImage(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  options: { apiKey: string; model?: string },
): Promise<XrfOcrResult> {
  const client = new Anthropic({ apiKey: options.apiKey });
  const model = await resolveModel(client, options.model);
  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildContent(imageBase64, mediaType) }],
  });
  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude response has no text block.');
  }
  const { readings, notes } = parse(textBlock.text);
  return { readings, notes, raw: textBlock.text };
}
