import type Anthropic from '@anthropic-ai/sdk';

// Cache per API-key (by a short suffix, never the full key) so distinct keys —
// which may have different model access — never share a resolved model.
const cache = new Map<string, string>();

function cacheKey(client: Anthropic): string {
  const raw = (client as unknown as { apiKey?: string }).apiKey ?? '';
  return raw ? raw.slice(-8) : 'default';
}

/**
 * Resolves a usable vision-capable Claude model for this account.
 *
 * If an explicit model is supplied, it is used. Otherwise the API is asked which
 * models are available and a sensible one is chosen (prefer a Sonnet for
 * speed/cost, then Opus, then anything). The result is cached PER API KEY so it
 * keeps working as Anthropic renames/retires models, without leaking one key's
 * model choice to another key.
 */
export async function resolveVisionModel(client: Anthropic, preferred?: string): Promise<string> {
  if (preferred) return preferred;
  const key = cacheKey(client);
  const hit = cache.get(key);
  if (hit) return hit;
  const list = await client.models.list({ limit: 100 });
  const ids = list.data.map((m) => m.id);
  const sonnet = ids.find((id) => id.includes('sonnet'));
  const opus = ids.find((id) => id.includes('opus'));
  const chosen = sonnet ?? opus ?? ids[0];
  if (!chosen) throw new Error('No models available for this API key.');
  cache.set(key, chosen);
  return chosen;
}
