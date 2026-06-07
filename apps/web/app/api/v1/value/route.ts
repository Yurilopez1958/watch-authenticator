import { estimateMarketPrice, type MarketEstimateInput } from '@watch-auth/core';
import { requireApiKey } from '@/lib/server/api-key';
import { enforceQuota } from '@/lib/server/guard';
import { errorResponse } from '@/lib/server/errors';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Dealer API: POST a watch, get a market valuation. Auth: Bearer wa_live_... */
export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'valuation_unavailable' }, { status: 503 });

    const ctx = await requireApiKey(req);
    await enforceQuota(ctx, 'valuation');

    const body = (await req.json().catch(() => ({}))) as Partial<MarketEstimateInput>;
    const { brand, model, reference, year } = body;
    if (!brand || !model) return Response.json({ error: 'brand and model are required' }, { status: 400 });

    const estimate = await estimateMarketPrice(
      { brand, model, ...(reference ? { reference } : {}), ...(year ? { year } : {}) },
      { apiKey, ...(process.env.ANTHROPIC_MODEL ? { model: process.env.ANTHROPIC_MODEL } : {}) },
    );
    return Response.json({ data: estimate });
  } catch (e) {
    return errorResponse(e);
  }
}
