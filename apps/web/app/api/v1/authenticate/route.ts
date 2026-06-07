import { analyzeWatchPart, type VisionAnalysisInput } from '@watch-auth/core';
import { requireApiKey } from '@/lib/server/api-key';
import { enforceQuota } from '@/lib/server/guard';
import { errorResponse } from '@/lib/server/errors';

export const runtime = 'nodejs';
export const maxDuration = 45;

const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp'];

/** Dealer API: POST a watch part + photo, get an AI visual analysis. */
export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'authentication_unavailable' }, { status: 503 });

    const ctx = await requireApiKey(req);
    await enforceQuota(ctx, 'auth');

    const body = (await req.json().catch(() => ({}))) as Partial<VisionAnalysisInput>;
    const { brandName, modelName, modelReference, yearOfManufacture, part, examined, references } = body;
    if (!brandName || !modelName || !part || !examined?.imageData) {
      return Response.json({ error: 'brandName, modelName, part and examined.imageData are required' }, { status: 400 });
    }
    if (!examined.mediaType || !ALLOWED_MEDIA.includes(examined.mediaType)) {
      return Response.json({ error: 'invalid examined.mediaType' }, { status: 400 });
    }
    if ((references ?? []).length > 6) {
      return Response.json({ error: 'too many references (max 6)' }, { status: 400 });
    }

    const result = await analyzeWatchPart(
      {
        brandName, modelName,
        modelReference: modelReference ?? '',
        yearOfManufacture: yearOfManufacture ?? 0,
        part, examined, references: references ?? [],
      },
      { apiKey, ...(process.env.ANTHROPIC_MODEL ? { model: process.env.ANTHROPIC_MODEL } : {}) },
    );
    return Response.json({ data: result });
  } catch (e) {
    return errorResponse(e);
  }
}
