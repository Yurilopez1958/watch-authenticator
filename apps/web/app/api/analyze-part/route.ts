import { NextResponse } from 'next/server';
import { analyzeWatchPart, type VisionAnalysisInput } from '@watch-auth/core';

export const runtime = 'nodejs';
export const maxDuration = 45;

type Body = Partial<VisionAnalysisInput>;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'AI vision is not configured. Set ANTHROPIC_API_KEY in the deployment environment to enable photo analysis.',
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
    return NextResponse.json(
      { error: `AI analysis failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
