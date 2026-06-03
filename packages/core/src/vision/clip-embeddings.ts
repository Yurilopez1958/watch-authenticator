/**
 * Utilidades para embeddings visuales tipo CLIP y similitud.
 *
 * Estrategia en capas:
 * - Para el navegador y móvil podemos usar transformers.js (@xenova/transformers)
 *   con `Xenova/clip-vit-base-patch32` (descarga del modelo ~150 MB en primer uso,
 *   ejecución on-device via ONNX Runtime Web).
 * - Para servidor (Next.js API routes) la misma librería funciona en Node.
 * - Para producción con muchas referencias conviene calcular embeddings server-side
 *   y persistir en Supabase con la extensión pgvector.
 *
 * Este módulo expone helpers puros (cosineSimilarity, findMostSimilar, normalize)
 * y un lazy loader del extractor para no obligar a cargar el modelo en imports.
 */

export type Embedding = readonly number[];

export type ScoredReference<T> = {
  reference: T;
  similarity: number;
};

/** Norma euclidiana (L2) de un vector. */
export function norm(v: Embedding): number {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i]! * v[i]!;
  return Math.sqrt(s);
}

/** Devuelve el vector normalizado a L2 = 1. Útil para reducir el coseno a producto punto. */
export function normalize(v: Embedding): number[] {
  const n = norm(v);
  if (n === 0) return Array.from(v);
  return Array.from(v, (x) => x / n);
}

/**
 * Similitud coseno entre dos embeddings. Rango [-1, 1], donde 1 = idénticos.
 * Para vectores ya normalizados (norma 1) basta con sumar productos puntuales.
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) {
    throw new Error(`Dimensión de embeddings distinta: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Devuelve las N referencias más similares a un embedding objetivo, ordenadas
 * de más similar a menos.
 */
export function findMostSimilar<T>(
  target: Embedding,
  references: Iterable<{ embedding: Embedding; reference: T }>,
  topN = 5,
): ScoredReference<T>[] {
  const scored: ScoredReference<T>[] = [];
  for (const r of references) {
    scored.push({ reference: r.reference, similarity: cosineSimilarity(target, r.embedding) });
  }
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, topN);
}

/**
 * Carga perezosa del extractor CLIP. Solo intenta importar @xenova/transformers
 * cuando se invoca, así un build de SSR/Next.js no se rompe si no está instalado.
 *
 * Antes de usar en producción: `pnpm add @xenova/transformers` en el workspace
 * donde corra el embedding (web app o API route).
 */
export type ImageEmbedder = (image: Blob | string | Uint8Array) => Promise<number[]>;

let cachedExtractor: ((input: unknown, opts: unknown) => Promise<{ data: Float32Array }>) | null = null;

export async function loadClipImageEmbedder(
  modelId = 'Xenova/clip-vit-base-patch32',
): Promise<ImageEmbedder> {
  if (!cachedExtractor) {
    const mod: { pipeline: (task: string, model: string) => Promise<unknown> } =
      await import(/* webpackIgnore: true */ '@xenova/transformers' as string);
    cachedExtractor = (await mod.pipeline('image-feature-extraction', modelId)) as typeof cachedExtractor;
  }
  if (!cachedExtractor) throw new Error('No se pudo cargar el modelo CLIP');
  const extractor = cachedExtractor;
  return async (image) => {
    const result = await extractor(image, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  };
}
