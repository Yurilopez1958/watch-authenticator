import { getSupabase } from './supabase';

export type CloudPhoto = {
  id: string;
  brandId: string;
  modelId: string;
  caliber: string | null;
  year: number | null;
  part: string;
  storagePath: string;
  /** Signed URL to display the image. */
  url: string;
};

const BUCKET = 'gallery';

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) {
    throw new Error('Invalid image data (expected a base64 data URL).');
  }
  const head = dataUrl.slice(5, comma); // e.g. "image/jpeg;base64"
  if (!/;base64$/i.test(head)) {
    throw new Error('Invalid image data (expected base64 encoding).');
  }
  const mime = head.split(';')[0] || 'image/jpeg';
  const ext = (mime.split('/')[1] || 'jpg').toLowerCase();
  const bin = atob(dataUrl.slice(comma + 1));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return { blob: new Blob([arr], { type: mime }), ext };
}

/** Uploads a photo to Storage + inserts its metadata row. Returns the new row id. */
export async function uploadCloudPhoto(input: {
  userId: string;
  brandId: string;
  modelId: string;
  caliber: string;
  year: number;
  part: string;
  dataUrl: string;
}): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Sync not configured.');
  const { blob, ext } = dataUrlToBlob(input.dataUrl);
  const rand = crypto.randomUUID();
  // Path MUST start with the user id (RLS checks the first folder segment).
  const storagePath = `${input.userId}/${input.brandId}/${input.modelId}/${input.part}/${rand}.${ext}`;

  const up = await sb.storage.from(BUCKET).upload(storagePath, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (up.error) throw up.error;

  const ins = await sb.from('gallery_photos').insert({
    user_id: input.userId,
    brand_id: input.brandId,
    model_id: input.modelId,
    caliber: input.caliber,
    year: input.year,
    part: input.part,
    storage_path: storagePath,
  });
  if (ins.error) {
    // best-effort cleanup of the orphaned file
    await sb.storage.from(BUCKET).remove([storagePath]);
    throw ins.error;
  }
}

/** Lists cloud photos for a brand + model + part with signed display URLs. */
export async function listCloudPhotos(
  brandId: string,
  modelId: string,
  part: string,
): Promise<CloudPhoto[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('gallery_photos')
    .select('id, brand_id, model_id, caliber, year, part, storage_path, created_at')
    .eq('brand_id', brandId)
    .eq('model_id', modelId)
    .eq('part', part)
    .order('created_at', { ascending: false });
  if (error || !data) return [];

  // Sign all paths in ONE request instead of N sequential round-trips.
  const paths = data.map((row) => row.storage_path);
  const { data: signed } = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600);
  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }

  return data.map((row) => ({
    id: row.id,
    brandId: row.brand_id,
    modelId: row.model_id,
    caliber: row.caliber,
    year: row.year,
    part: row.part,
    storagePath: row.storage_path,
    url: urlByPath.get(row.storage_path) ?? '',
  }));
}

/** Count of cloud photos for a brand + model (across parts). */
export async function countCloudByModel(brandId: string, modelId: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  const { count } = await sb
    .from('gallery_photos')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .eq('model_id', modelId);
  return count ?? 0;
}

/** Deletes a cloud photo. Removes the metadata row first (the source of truth
 *  for listings): a file without a row is invisible and reclaimable by a job,
 *  whereas a row without a file shows as a permanently broken image. */
export async function deleteCloudPhoto(id: string, storagePath: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const del = await sb.from('gallery_photos').delete().eq('id', id);
  if (del.error) throw del.error;
  const rm = await sb.storage.from(BUCKET).remove([storagePath]);
  if (rm.error) console.warn('Row deleted but file remains:', storagePath, rm.error.message);
}
