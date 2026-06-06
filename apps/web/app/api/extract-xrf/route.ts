import { NextResponse } from 'next/server';
import { extractXrfFromImage } from '@watch-auth/core';
import { checkAccess } from '@/lib/server/guard';

export const runtime = 'nodejs';
export const maxDuration = 30;

type Body = {
  imageBase64?: string;
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Photo reading is not available right now.',
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

  const { imageBase64, mediaType } = body;
  const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp'];
  if (!imageBase64 || !mediaType || !ALLOWED_MEDIA.includes(mediaType)) {
    return NextResponse.json({ error: 'Missing or invalid imageBase64/mediaType.' }, { status: 400 });
  }

  // SaaS gate (no-op while SAAS_ENABLED is off). Helper OCR — access only, no quota.
  const blocked = await checkAccess(req);
  if (blocked) return blocked;

  const model = process.env.ANTHROPIC_MODEL;
  try {
    const result = await extractXrfFromImage(imageBase64, mediaType, {
      apiKey,
      ...(model ? { model } : {}),
    });
    // Do not expose the raw model output to the client.
    return NextResponse.json({ readings: result.readings, notes: result.notes });
  } catch (err) {
    console.error('extract-xrf failed:', err);
    return NextResponse.json({ error: 'Could not read the screen. Please try again.' }, { status: 500 });
  }
}
