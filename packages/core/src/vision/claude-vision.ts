import Anthropic from '@anthropic-ai/sdk';
import type { WatchPart } from '../types/index';

export type ReferencePhoto = {
  part: WatchPart;
  /** Base64 sin prefijo data: o URL https accesible públicamente. */
  imageData: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  notes?: string;
};

export type VisionAnalysisInput = {
  brandName: string;
  modelName: string;
  modelReference: string;
  yearOfManufacture: number;
  part: WatchPart;
  examined: {
    imageData: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  };
  references: ReferencePhoto[];
};

export type DiscrepancyFinding = {
  severity: 'low' | 'medium' | 'high';
  area: string;
  description: string;
};

export type VisionAnalysisResult = {
  verdict: 'consistent' | 'suspicious' | 'inconclusive';
  confidence: number;
  summary: string;
  findings: DiscrepancyFinding[];
};

const SYSTEM_PROMPT = `You are an expert in high-end watch authentication, experienced in identifying \
differences between authentic pieces and replicas. You analyze photos of specific watch parts \
(movement, hands, logo, crown, dial, etc.) by comparing them against authentic references. \
Be concrete, factual, and always answer in English. Avoid definitive claims: full authentication \
requires physical inspection in hand, so your role is to flag visual inconsistencies.`;

function buildUserMessage(input: VisionAnalysisInput): Anthropic.Messages.MessageParam {
  const content: Anthropic.Messages.ContentBlockParam[] = [];

  content.push({
    type: 'text',
    text: `Visual analysis of a ${input.brandName} ${input.modelName} (ref. ${input.modelReference}), \
declared year ${input.yearOfManufacture}.

Examined part: ${input.part}.

Below you will see first the photo of the piece under examination and then ${input.references.length} \
authentic reference photo(s) of the same part to compare against.`,
  });

  content.push({ type: 'text', text: '**Photo of the examined watch:**' });
  content.push({
    type: 'image',
    source: {
      type: 'base64',
      media_type: input.examined.mediaType,
      data: input.examined.imageData,
    },
  });

  for (let i = 0; i < input.references.length; i++) {
    const ref = input.references[i]!;
    content.push({
      type: 'text',
      text: `**Authentic reference #${i + 1}** (part: ${ref.part}${ref.notes ? ' — ' + ref.notes : ''}):`,
    });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: ref.mediaType, data: ref.imageData },
    });
  }

  content.push({
    type: 'text',
    text: `Respond ONLY with a valid JSON object, no extra text or code fences, with this structure:
{
  "verdict": "consistent" | "suspicious" | "inconclusive",
  "confidence": number between 0 and 1,
  "summary": "one-sentence summary of the overall finding",
  "findings": [
    { "severity": "low"|"medium"|"high", "area": "which part of the image", "description": "what you observe" }
  ]
}`,
  });

  return { role: 'user', content };
}

function parseResponse(text: string): VisionAnalysisResult {
  const trimmed = text.trim();
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`Response contains no JSON: ${trimmed.slice(0, 200)}`);
  }
  const json = trimmed.slice(jsonStart, jsonEnd + 1);
  const parsed = JSON.parse(json) as VisionAnalysisResult;
  return parsed;
}

/**
 * Analyzes a photo of the examined watch by comparing it with authentic reference
 * photos using Claude Vision. Returns verdict, confidence and structured findings.
 */
export async function analyzeWatchPart(
  input: VisionAnalysisInput,
  options: { apiKey: string; model?: string } = { apiKey: '' },
): Promise<VisionAnalysisResult> {
  const client = new Anthropic({ apiKey: options.apiKey });
  const message = await client.messages.create({
    model: options.model ?? 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [buildUserMessage(input)],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude response has no text block.');
  }
  return parseResponse(textBlock.text);
}
