import { NextResponse } from 'next/server';
import { analyzeWatchPart, type VisionAnalysisInput } from '@watch-auth/core';
import { checkUsage } from '@/lib/server/guard';

export const runtime = 'nodejs';
export const maxDuration = 45;

type Body = Partial<VisionAnalysisInput>;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Visual analysis is not available right now.',
        code: 'NO_API_KEY',
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { brandName, modelName, modelReference, yearOfManufacture, part, examined, references } = body;
  if (!brandName || !modelName || !part || !examined?.imageData) {
    return NextResponse.json({ error: 'Missing required fields (brand, model, part, examined photo).' }, { status: 400 });
  }
  const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp'];
  if (!examined.mediaType || !ALLOWED_MEDIA.includes(examined.mediaType)) {
    return NextResponse.json({ error: 'Invalid or missing image mediaType.' }, { status: 400 });
  }
  if ((references ?? []).length > 6) {
    return NextResponse.json({ error: 'Too many reference photos (max 6).' }, { status: 400 });
  }

  // SaaS gate (no-op while SAAS_ENABLED is off). Counts as one authentication.
  const blocked = await checkUsage(req, 'auth');
  if (blocked) return blocked;

  const model = process.env.ANTHROPIC_MODEL;
  try {
    const result = await analyzeWatchPart(
      {
        brandName,
        modelName,
        modelReference: modelReference ?? '',
        yearOfManufacture: yearOfManufacture ?? 0,
        part,
        examined,
        references: references ?? [],
      },
      { apiKey, ...(model ? { model } : {}) },
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error('analyze-part failed:', err);
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 });
  }
}
