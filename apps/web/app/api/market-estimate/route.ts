import { NextResponse } from 'next/server';
import { estimateMarketPrice, type MarketEstimateInput } from '@watch-auth/core';
import { checkUsage } from '@/lib/server/guard';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The market estimate is not available right now.', code: 'NO_API_KEY' },
      { status: 503 },
    );
  }

  let body: Partial<MarketEstimateInput>;
  try {
    body = (await req.json()) as Partial<MarketEstimateInput>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { brand, model, reference, year } = body;
  if (!brand || !model || brand.length > 80 || model.length > 80 || (reference != null && String(reference).length > 60)) {
    return NextResponse.json({ error: 'Missing or oversized brand/model/reference.' }, { status: 400 });
  }

  // SaaS gate (no-op while SAAS_ENABLED is off). Counts as one valuation.
  const blocked = await checkUsage(req, 'valuation');
  if (blocked) return blocked;

  const overrideModel = process.env.ANTHROPIC_MODEL;
  try {
    const estimate = await estimateMarketPrice(
      { brand, model, ...(reference ? { reference } : {}), ...(year ? { year } : {}) },
      { apiKey, ...(overrideModel ? { model: overrideModel } : {}) },
    );
    return NextResponse.json(estimate);
  } catch (err) {
    console.error('market-estimate failed:', err);
    return NextResponse.json({ error: 'Market estimate failed. Please try again.' }, { status: 500 });
  }
}
