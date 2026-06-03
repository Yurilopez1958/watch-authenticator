import type Anthropic from '@anthropic-ai/sdk';

let cached: string | null = null;

/**
 * Resolves a usable vision-capable Claude model for this account.
 *
 * If an explicit model is supplied, it is used. Otherwise the API is asked which
 * models are available and a sensible one is chosen (prefer a Sonnet for
 * speed/cost, then Opus, then anything). The result is cached for the process.
 * This keeps every vision feature working even as Anthropic renames or retires
 * models — no hardcoded model strings to break.
 */
export async function resolveVisionModel(client: Anthropic, preferred?: string): Promise<string> {
  if (preferred) return preferred;
  if (cached) return cached;
  const list = await client.models.list({ limit: 50 });
  const ids = list.data.map((m) => m.id);
  const sonnet = ids.find((id) => id.includes('sonnet'));
  const opus = ids.find((id) => id.includes('opus'));
  const chosen = sonnet ?? opus ?? ids[0];
  if (!chosen) throw new Error('No models available for this API key.');
  cached = chosen;
  return chosen;
}
