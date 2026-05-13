export type RecommendationMode = 'individual' | 'group' | 'date'

export interface UserInput {
  mode: RecommendationMode
  transcript: string
}

export interface Recommendation {
  id: string
  name: string
  description: string
  tags: string[]
}
