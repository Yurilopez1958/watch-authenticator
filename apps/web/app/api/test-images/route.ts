import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Test-only importer: pulls a few openly-licensed sample images from Wikimedia
// Commons so the gallery can be filled quickly to exercise the app's flows
// (display, cloud sync, AI analysis). These are NOT verified-authentic
// references — they are placeholders for testing only.

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const ALLOWED_IMAGE_HOST = 'upload.wikimedia.org';
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const UA = 'WatchAuthenticator-TestImporter/1.0 (educational test use)';
const MAX_BYTES = 5_000_000;

type CommonsPage = {
  title?: string;
  imageinfo?: {
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    extmetadata?: { LicenseShortName?: { value?: string } };
  }[];
};

type TestImage = {
  dataUrl: string;
  title: string;
  descriptionUrl: string;
  license: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const count = Math.min(4, Math.max(1, parseInt(url.searchParams.get('count') ?? '1', 10) || 1));
  if (!q) {
    return NextResponse.json({ error: 'Missing search query (q).' }, { status: 400 });
  }

  try {
    const apiUrl =
      `${COMMONS_API}?action=query&format=json&origin=*` +
      `&generator=search&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}` +
      `&gsrnamespace=6&gsrlimit=${count * 4}` +
      `&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=900`;

    const apiRes = await fetch(apiUrl, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!apiRes.ok) {
      return NextResponse.json({ error: 'Commons search failed.' }, { status: 502 });
    }
    const data = (await apiRes.json()) as { query?: { pages?: Record<string, CommonsPage> } };
    const pages = data.query?.pages ? Object.values(data.query.pages) : [];

    const images: TestImage[] = [];
    for (const page of pages) {
      if (images.length >= count) break;
      const info = page.imageinfo?.[0];
      const thumb = info?.thumburl;
      if (!thumb) continue;

      // SSRF guard: only ever fetch image bytes from Wikimedia's upload host.
      let host = '';
      try { host = new URL(thumb).host; } catch { continue; }
      if (host !== ALLOWED_IMAGE_HOST) continue;

      try {
        const imgRes = await fetch(thumb, { headers: { 'User-Agent': UA } });
        if (!imgRes.ok) continue;
        const mime = (imgRes.headers.get('content-type') ?? '').split(';')[0]!.trim();
        if (!ALLOWED_MIME.includes(mime)) continue;
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) continue;
        images.push({
          dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
          title: page.title ?? '',
          descriptionUrl: info?.descriptionurl ?? '',
          license: info?.extmetadata?.LicenseShortName?.value ?? 'see Wikimedia Commons',
        });
      } catch {
        continue;
      }
    }

    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
