export type RecommendationMode = 'individual' | 'group' | 'date';

export interface UserInput {
  mode: RecommendationMode;
  transcript: string;
}

export interface PlaceRecommendation {
  name: string;
  area: string;
  description: string;
  cuisineType: string;
  priceRange: 'budget' | 'moderate' | 'upscale' | 'fine_dining';
  whyItMatches: string;
  rating: number;
  latitude: number;
  longitude: number;
}

export type { ParsedTranscript } from '@/src/utils/parseTranscript';
