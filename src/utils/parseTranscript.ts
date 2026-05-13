import { z } from 'zod/v4';

import { groqClient } from './groqClient';

const ParsedTranscriptSchema = z.object({
  mode: z.enum(['individual', 'date', 'group']),
  groupSize: z.int().min(1),
  cuisines: z.array(z.string()),
  priceRange: z.enum(['budget', 'moderate', 'upscale', 'fine_dining']),
  vibes: z.array(z.string()),
  dietaryNeeds: z.array(z.string()),
  summary: z.string(),
});

export type ParsedTranscript = z.infer<typeof ParsedTranscriptSchema>;

const DINING_PREFERENCES_SCHEMA = {
  type: 'object',
  properties: {
    mode: { type: 'string', enum: ['individual', 'date', 'group'] },
    groupSize: { type: 'integer', minimum: 1 },
    cuisines: { type: 'array', items: { type: 'string' } },
    priceRange: { type: 'string', enum: ['budget', 'moderate', 'upscale', 'fine_dining'] },
    vibes: { type: 'array', items: { type: 'string' } },
    dietaryNeeds: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['mode', 'groupSize', 'cuisines', 'priceRange', 'vibes', 'dietaryNeeds', 'summary'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are a dining preference parser for the Philippines market. Given a free-form description of what someone wants to eat and who they are dining with, extract structured preferences.

Rules:
- mode: "individual" for solo dining, "date" for two-person romantic/couple context, "group" for 3+ people or explicitly mentioned groups
- groupSize: total number of diners (default 1 for individual, 2 for date, 4 for group if unspecified)
- cuisines: list of cuisine types mentioned or implied (e.g. "Filipino", "Italian", "Japanese"); empty array if none specified
- priceRange: infer from Philippine peso context — "budget" (under ₱200/head), "moderate" (₱200–600/head, nothing too fancy), "upscale" (₱600–1500/head, nice quality), "fine_dining" (₱1500+/head, very fancy)
- vibes: descriptive atmosphere tags (e.g. "romantic", "casual", "lively", "quiet", "cozy", "trendy"); empty array if none implied
- dietaryNeeds: any dietary restrictions or preferences mentioned (e.g. "vegetarian", "vegan", "halal", "kosher", "gluten-free"); empty array if none
- summary: one sentence summarising the inferred preferences in natural language`;

export async function parseTranscript(transcript: string): Promise<ParsedTranscript> {
  const response = await groqClient.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: transcript },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'dining_preferences',
        strict: true,
        schema: DINING_PREFERENCES_SCHEMA,
      },
    },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq');
  }

  const result = ParsedTranscriptSchema.safeParse(JSON.parse(content));
  if (!result.success) {
    throw new Error('Unexpected response structure from Groq');
  }

  return result.data;
}
