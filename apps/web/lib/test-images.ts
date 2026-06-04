// Client helper for the test-only sample-image importer. Maps each gallery part
// to a Commons search query and fetches a few openly-licensed images via the
// /api/test-images route. For TESTING the app only — not real references.

export type TestImage = {
  dataUrl: string;
  title: string;
  descriptionUrl: string;
  license: string;
};

/** Search terms per gallery part, biased toward photos that show that part. */
const PART_QUERY: Record<string, string> = {
  movement: 'watch movement caliber',
  dial: 'watch dial',
  hands: 'watch hands',
  logo: 'wristwatch crown logo',
  crown: 'watch crown winding',
  bezel: 'watch bezel',
  'case-back': 'watch case back',
  'serial-number': 'watch caseback engraving',
  'bracelet-link': 'watch bracelet',
  clasp: 'watch clasp deployant',
};

/** Fetches up to `count` sample images for a given brand + part. Never throws —
 *  returns [] on any failure so one bad part doesn't abort the whole import. */
export async function fetchTestImages(
  brandName: string,
  partId: string,
  count = 1,
): Promise<TestImage[]> {
  const base = PART_QUERY[partId] ?? 'wristwatch';
  const q = `${brandName} ${base}`.trim();
  try {
    const res = await fetch(`/api/test-images?q=${encodeURIComponent(q)}&count=${count}`);
    if (!res.ok) return [];
    const json = (await res.json()) as { images?: TestImage[] };
    return json.images ?? [];
  } catch {
    return [];
  }
}
