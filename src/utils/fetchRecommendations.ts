import { z } from 'zod/v4';

import type { PlaceRecommendation } from '@/src/types';
import { groqClient } from './groqClient';
import type { ParsedTranscript } from './parseTranscript';

const PlaceRecommendationSchema = z.object({
  name: z.string(),
  area: z.string(),
  description: z.string(),
  cuisineType: z.string(),
  priceRange: z.enum(['budget', 'moderate', 'upscale', 'fine_dining']),
  whyItMatches: z.string(),
  rating: z.number().min(1).max(5),
  latitude: z.number(),
  longitude: z.number(),
});

const RecommendationsResponseSchema = z.object({
  recommendations: z.array(PlaceRecommendationSchema),
});

const SYSTEM_PROMPT = `You are a Philippines dining and lifestyle guide. Given structured dining preferences, recommend 4 real, well-known restaurants or food destinations in the Philippines that match.

Context:
- Price ranges in Philippine Peso:
  budget = under PHP 200/head
  moderate = PHP 200-600/head
  upscale = PHP 600-1500/head
  fine_dining = PHP 1500+/head
- You know the Philippine food scene well: BGC (Taguig), Makati, Quezon City, Pasig, Pasay, Cebu City, Davao, and beyond
- Include a mix of areas when possible
- Prioritise places that genuinely match the vibe, cuisine, and price level requested
- For "date" mode, lean toward atmospheric or intimate spots
- For "group" mode, lean toward lively or family-friendly spots with good sharing options
- For "individual" mode, cafes, solo-friendly counters, or solo dining bars are great

Each recommendation must have:
- name: the restaurant or place name
- area: neighbourhood and city (e.g. "BGC, Taguig" or "Poblacion, Makati")
- description: 1-2 sentences describing what it is
- cuisineType: primary cuisine (e.g. "Filipino", "Japanese", "Italian")
- priceRange: one of budget / moderate / upscale / fine_dining
- whyItMatches: one short sentence on why it fits this specific request
- rating: typical rating out of 5 based on general reputation (e.g. 4.3)
- latitude: approximate GPS latitude of the place
- longitude: approximate GPS longitude of the place

Output: valid JSON only. No preamble, no post-analysis, no conversational text.`;

export async function fetchRecommendations(
  preferences: ParsedTranscript,
): Promise<PlaceRecommendation[]> {
  const userMessage = `Find me places matching these preferences:
- Mode: ${preferences.mode} (${preferences.groupSize} people)
- Cuisines: ${preferences.cuisines.length > 0 ? preferences.cuisines.join(', ') : 'any'}
- Price range: ${preferences.priceRange}
- Vibe: ${preferences.vibes.length > 0 ? preferences.vibes.join(', ') : 'any'}
- Dietary needs: ${preferences.dietaryNeeds.length > 0 ? preferences.dietaryNeeds.join(', ') : 'none'}
- Summary: ${preferences.summary}`;

  const response = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq');
  }

  const result = RecommendationsResponseSchema.safeParse(JSON.parse(content));
  if (!result.success) {
    throw new Error('Unexpected recommendations structure from Groq');
  }

  return result.data.recommendations;
}
