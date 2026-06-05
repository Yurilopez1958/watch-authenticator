export { analyzeWatchPart } from './claude-vision';
export type {
  DiscrepancyFinding,
  ReferencePhoto,
  VisionAnalysisInput,
  VisionAnalysisResult,
} from './claude-vision';
export {
  cosineSimilarity,
  findMostSimilar,
  loadClipImageEmbedder,
  norm,
  normalize,
} from './clip-embeddings';
export type { Embedding, ImageEmbedder, ScoredReference } from './clip-embeddings';
export { extractXrfFromImage } from './xrf-ocr';
export type { XrfOcrResult } from './xrf-ocr';
export { estimateMarketPrice } from './market-estimate';
export type { MarketEstimate, MarketEstimateInput } from './market-estimate';
