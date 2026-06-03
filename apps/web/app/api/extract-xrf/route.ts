import { NextResponse } from 'next/server';
import { extractXrfFromImage } from '@watch-auth/core';

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
        error: 'AI vision is not configured. Set ANTHROPIC_API_KEY in the deployment environment to enable photo reading.',
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
  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'Missing imageBase64 or mediaType.' }, { status: 400 });
  }

  try {
    const result = await extractXrfFromImage(imageBase64, mediaType, { apiKey });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not read the screen: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
