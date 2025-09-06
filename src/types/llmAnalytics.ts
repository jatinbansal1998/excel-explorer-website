export interface KeyValueInsight {
  key: string
  value: string
}

export interface PromptSuggestion {
  id: string
  category: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive' | 'other'
  prompt: string
  rationale?: string
}

export interface LLMAnalyticsResponse {
  insights: KeyValueInsight[]
  followUps?: PromptSuggestion[]
}

// Centralized schema text for prompts. Keep aligned with the interfaces above.
export const LLM_ANALYTICS_SCHEMA_TEXT: string = [
  'interface KeyValueInsight { key: string; value: string }',
  "interface PromptSuggestion { id: string; category: 'descriptive'|'diagnostic'|'predictive'|'prescriptive'|'other'; prompt: string; rationale?: string }",
  'interface LLMAnalyticsResponse { insights: KeyValueInsight[]; followUps?: PromptSuggestion[] }',
].join('\n')
