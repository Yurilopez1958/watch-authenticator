import Anthropic from '@anthropic-ai/sdk';
import { resolveVisionModel } from './model-resolver';

/** Orientative current-market estimate produced by the AI (not a live quote). */
export type MarketEstimate = {
  /** USD average secondary / collector market price. */
  retail: number;
  /** USD typical wholesale / dealer buy price. */
  wholesale: number;
  grade: 'fast' | 'medium' | 'slow';
  /** 0–100 demand. */
  demandScore: number;
  note: string;
};

export type MarketEstimateInput = {
  brand: string;
  model: string;
  reference?: string;
  year?: number;
};

const SYSTEM = `You are a luxury-watch market analyst. Given a watch, return your best ORIENTATIVE estimate of \
its CURRENT secondary (pre-owned / collector) market in USD: the average retail (what it actually sells for now), \
a realistic wholesale / dealer buy price (typically 10–18% below retail), a liquidity grade and a demand score. \
Base it on your knowledge of the watch market and recent trends. This is an orientative estimate, NOT a live quote.`;

/** Asks the model for an orientative current-market valuation. */
export async function estimateMarketPrice(
  input: MarketEstimateInput,
  options: { apiKey: string; model?: string },
): Promise<MarketEstimate> {
  const client = new Anthropic({ apiKey: options.apiKey });
  const model = await resolveVisionModel(client, options.model);

  const user = `Watch: ${input.brand} ${input.model}${input.reference ? ' (ref. ' + input.reference + ')' : ''}${input.year ? ', year ' + input.year : ''}.

Respond ONLY with a valid JSON object, no extra text or code fences:
{"retail": number (USD), "wholesale": number (USD), "grade": "fast" | "medium" | "slow", "demandScore": number 0-100, "note": "one short sentence on the current market"}`;

  const message = await client.messages.create({
    model,
    max_tokens: 400,
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
  });

  const block = message.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('AI returned no text.');
  const text = block.text.trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON in response: ${text.slice(0, 120)}`);
  const raw = JSON.parse(text.slice(start, end + 1)) as Partial<MarketEstimate>;

  const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  return {
    retail: Math.max(0, Math.round(num(raw.retail))),
    wholesale: Math.max(0, Math.round(num(raw.wholesale))),
    grade: raw.grade === 'fast' || raw.grade === 'slow' ? raw.grade : 'medium',
    demandScore: Math.max(0, Math.min(100, Math.round(num(raw.demandScore, 50)))),
    note: typeof raw.note === 'string' ? raw.note : '',
  };
}
