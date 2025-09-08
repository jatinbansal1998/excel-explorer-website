# Implementation Plan: Phase 4 - OpenRouter Integration & LLM Analytics

## Overview

Implement seamless OpenRouter integration for LLM analytics, including advanced prompt engineering, intelligent data
analysis, and enhanced user experience with real-time suggestions and insights generation.

## Current State Analysis

- **Basic LLM Integration**: Current implementation has limited OpenRouter integration
- **Prompt Engineering**: Lacks sophisticated prompt engineering strategies
- **Data Context**: Limited context passing to LLM for data analysis
- **User Experience**: Basic UI for LLM interactions without advanced features
- **Performance**: LLM calls are not optimized for performance and cost
- **Error Handling**: Basic error handling without comprehensive recovery strategies

## Types

Single sentence describing the type system changes.

Detailed type definitions, interfaces, enums, or data structures with complete specifications. Include field names,
types, validation rules, and relationships.

### OpenRouter Integration Types

```typescript
// OpenRouter configuration
interface OpenRouterConfig {
  apiKey: string
  baseUrl: string
  models: OpenRouterModel[]
  defaultModel: string
  maxTokens: number
  temperature: number
  topP: number
  timeout: number
  retryAttempts: number
  retryDelay: number
  streaming: boolean
  costOptimization: boolean
  cacheEnabled: boolean
  cacheTTL: number
}

// OpenRouter model information
interface OpenRouterModel {
  id: string
  name: string
  provider: string
  description: string
  maxTokens: number
  inputCost: number
  outputCost: number
  supportsStreaming: boolean
  supportsJson: boolean
  supportsVision: boolean
  supportsTools: boolean
  capabilities: ModelCapability[]
  category: ModelCategory
  popularity: number
}

type ModelCapability =
  | 'text-generation'
  | 'code-generation'
  | 'reasoning'
  | 'math'
  | 'vision'
  | 'json-mode'
  | 'function-calling'
  | 'streaming'
  | 'multilingual'

type ModelCategory = 'general' | 'coding' | 'math' | 'reasoning' | 'creative' | 'specialized'

// OpenRouter API request
interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  tools?: Tool[]
  tool_choice?: ToolChoice
  response_format?: ResponseFormat
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | Array<TextContent | ImageContent>
  name?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

interface TextContent {
  type: 'text'
  text: string
}

interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

// OpenRouter API response
interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: OpenRouterChoice[]
  usage: TokenUsage
  system_fingerprint?: string
}

interface OpenRouterChoice {
  index: number
  message: OpenRouterMessage
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter'
  delta?: OpenRouterMessage
}

interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

// Tool and function calling
interface Tool {
  type: 'function'
  function: FunctionDefinition
}

interface FunctionDefinition {
  name: string
  description: string
  parameters: ParameterSchema
}

interface ParameterSchema {
  type: 'object'
  properties: Record<string, ParameterProperty>
  required: string[]
}

interface ParameterProperty {
  type: string
  description?: string
  enum?: any[]
  items?: ParameterProperty
}

type ToolChoice = 'auto' | 'none' | { type: 'function'; function: { name: string } }

interface ResponseFormat {
  type: 'json_object' | 'text'
  schema?: ParameterSchema
}

// Tool call
interface ToolCall {
  id: string
  type: 'function'
  function: FunctionCall
}

interface FunctionCall {
  name: string
  arguments: string
}
```

### LLM Analytics Types

```typescript
// Analytics prompt configuration
interface AnalyticsPromptConfig {
  template: string
  variables: PromptVariable[]
  contextInclusion: ContextInclusionStrategy
  dataFormat: DataFormat
  outputFormat: OutputFormat
  model: string
  temperature: number
  maxTokens: number
}

interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  required: boolean
  defaultValue?: any
  validation?: ValidationRule[]
}

interface ValidationRule {
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'enum'
  value: any
  message: string
}

type ContextInclusionStrategy = 'full' | 'sample' | 'summary' | 'schema-only' | 'adaptive'

type DataFormat = 'json' | 'csv' | 'markdown' | 'natural-language'

type OutputFormat = 'json' | 'markdown' | 'html' | 'plain-text' | 'chart-config'

// Analytics suggestion
interface AnalyticsSuggestion {
  id: string
  title: string
  description: string
  prompt: string
  category: SuggestionCategory
  priority: Priority
  complexity: Complexity
  estimatedCost: number
  estimatedTime: number
  requiredData: DataRequirement[]
  expectedOutput: OutputExpectation
  tags: string[]
  popularity: number
  successRate: number
}

type SuggestionCategory =
  | 'trend-analysis'
  | 'correlation'
  | 'prediction'
  | 'anomaly-detection'
  | 'summarization'
  | 'visualization'
  | 'insight-generation'
  | 'data-cleaning'
  | 'feature-engineering'

type Priority = 'low' | 'medium' | 'high' | 'critical'

type Complexity = 'simple' | 'moderate' | 'complex' | 'expert'

interface DataRequirement {
  columnType: DataType
  minRows?: number
  maxRows?: number
  requiredColumns?: string[]
  dataQuality: DataQualityRequirement
}

interface DataQualityRequirement {
  completeness: number // 0-1
  uniqueness: number // 0-1
  validity: number // 0-1
  consistency: number // 0-1
}

interface OutputExpectation {
  type: 'chart' | 'table' | 'text' | 'insight' | 'prediction'
  format: OutputFormat
  confidence: number // 0-1
}

// Analytics insight
interface InsightCard {
  id: string
  title: string
  description: string
  insight: string
  confidence: number // 0-1
  category: InsightCategory
  importance: Importance
  supportingData: SupportingDataPoint[]
  visualizations: VisualizationConfig[]
  recommendations: string[]
  metadata: InsightMetadata
}

type InsightCategory =
  | 'trend'
  | 'anomaly'
  | 'correlation'
  | 'pattern'
  | 'outlier'
  | 'prediction'
  | 'summary'

type Importance = 'low' | 'medium' | 'high' | 'critical'

interface SupportingDataPoint {
  column: string
  value: any
  significance: number // 0-1
  context: string
}

interface VisualizationConfig {
  type: ChartType
  data: any
  options: ChartOptions
}

interface InsightMetadata {
  generatedAt: number
  model: string
  prompt: string
  processingTime: number
  cost: number
  tokensUsed: TokenUsage
  dataVersion: string
}
```

### Prompt Engineering Types

```typescript
// Prompt template
interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  variables: TemplateVariable[]
  context: ContextConfiguration
  output: OutputConfiguration
  model: string
  parameters: ModelParameters
  tags: string[]
  version: string
  createdAt: number
  updatedAt: number
}

interface TemplateVariable {
  name: string
  type: 'data' | 'context' | 'user-input' | 'system'
  description: string
  required: boolean
  defaultValue?: any
  validation?: ValidationRule[]
}

interface ContextConfiguration {
  strategy: ContextStrategy
  maxTokens: number
  compression: CompressionStrategy
  sampling: SamplingStrategy
  includeSchema: boolean
  includeStatistics: boolean
}

type ContextStrategy =
  | 'full-context'
  | 'sample-context'
  | 'summary-context'
  | 'schema-context'
  | 'adaptive-context'

type CompressionStrategy = 'none' | 'basic' | 'semantic' | 'statistical'

type SamplingStrategy = 'random' | 'stratified' | 'systematic' | 'adaptive'

interface OutputConfiguration {
  format: OutputFormat
  structure: OutputStructure
  validation: ValidationConfiguration
  postProcessing: PostProcessingConfiguration
}

interface OutputStructure {
  type: 'freeform' | 'structured' | 'semi-structured'
  schema?: ParameterSchema
  sections?: OutputSection[]
}

interface OutputSection {
  name: string
  description: string
  required: boolean
  type: 'text' | 'data' | 'chart' | 'table'
}

interface ValidationConfiguration {
  enabled: boolean
  rules: ValidationRule[]
  retryOnFailure: boolean
  fallbackStrategy: FallbackStrategy
}

type FallbackStrategy = 'retry' | 'simplify' | 'use-template' | 'return-error'

interface PostProcessingConfiguration {
  enabled: boolean
  operations: PostProcessingOperation[]
}

type PostProcessingOperation = 'format' | 'summarize' | 'extract' | 'validate' | 'enhance'

interface ModelParameters {
  temperature: number
  maxTokens: number
  topP: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
}

// Prompt engineering strategies
interface PromptEngineeringStrategy {
  name: string
  description: string
  techniques: PromptTechnique[]
  适用场景: string[]
  effectiveness: number // 0-1
  complexity: Complexity
}

type PromptTechnique =
  | 'chain-of-thought'
  | 'few-shot'
  | 'zero-shot'
  | 'role-playing'
  | 'step-by-step'
  | 'self-consistency'
  | 'tree-of-thought'
  | 'react'
  | 'tool-use'
  | 'instruction-following'

// Prompt optimization
interface PromptOptimization {
  id: string
  originalPrompt: string
  optimizedPrompt: string
  optimizationTechniques: string[]
  performanceMetrics: PromptPerformanceMetrics
  cost: CostAnalysis
  createdAt: number
}

interface PromptPerformanceMetrics {
  accuracy: number // 0-1
  relevance: number // 0-1
  completeness: number // 0-1
  coherence: number // 0-1
  userSatisfaction: number // 0-1
  processingTime: number
}

interface CostAnalysis {
  inputTokens: number
  outputTokens: number
  totalCost: number
  costPerResult: number
  optimization: number // percentage improvement
}
```

### Context Management Types

```typescript
// Data context
interface DataContext {
  data: any[][]
  metadata: DataMetadata
  schema: DataSchema
  statistics: DataStatistics
  quality: DataQuality
  version: string
  lastModified: number
}

interface DataMetadata {
  totalRows: number
  totalColumns: number
  fileSize: number
  encoding: string
  delimiter: string
  hasHeader: boolean
  source: string
  importedAt: number
}

interface DataSchema {
  columns: ColumnSchema[]
  relationships: RelationshipSchema[]
  constraints: ConstraintSchema[]
}

interface ColumnSchema {
  name: string
  type: DataType
  nullable: boolean
  unique: boolean
  primaryKey: boolean
  foreignKey?: ForeignKeyConstraint
  defaultValue?: any
  description: string
}

interface ForeignKeyConstraint {
  references: string
  onDelete: 'cascade' | 'restrict' | 'set-null' | 'set-default'
  onUpdate: 'cascade' | 'restrict' | 'set-null' | 'set-default'
}

interface RelationshipSchema {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  cardinality: string
}

interface ConstraintSchema {
  type: 'unique' | 'check' | 'foreign-key'
  columns: string[]
  definition: string
}

interface DataStatistics {
  columnStats: ColumnStatistics[]
  correlations: CorrelationMatrix
  distributions: DistributionInfo[]
  outliers: OutlierInfo[]
}

interface ColumnStatistics {
  column: string
  type: DataType
  count: number
  nullCount: number
  uniqueCount: number
  min?: number | Date
  max?: number | Date
  average?: number
  median?: number
  mode?: any
  standardDeviation?: number
  variance?: number
  skewness?: number
  kurtosis?: number
  quartiles: {
    q1: number
    q2: number // median
    q3: number
  }
}

interface CorrelationMatrix {
  matrix: number[][]
  columns: string[]
  method: 'pearson' | 'spearman' | 'kendall'
}

interface DistributionInfo {
  column: string
  type: 'normal' | 'uniform' | 'exponential' | 'binomial' | 'poisson' | 'custom'
  parameters: Record<string, number>
  fit: number // 0-1
}

interface OutlierInfo {
  column: string
  outliers: Outlier[]
  method: 'iqr' | 'z-score' | 'isolation-forest' | 'custom'
  threshold: number
}

interface Outlier {
  rowIndex: number
  value: any
  score: number
  reason: string
}

interface DataQuality {
  score: number // 0-1
  dimensions: QualityDimension[]
  issues: QualityIssue[]
  recommendations: string[]
}

interface QualityDimension {
  name: string
  score: number // 0-1
  weight: number
  description: string
}

interface QualityIssue {
  type: 'missing' | 'duplicate' | 'invalid' | 'inconsistent' | 'outlier'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedRows: number[]
  affectedColumns: string[]
  suggestion: string
}

// Context compression
interface ContextCompression {
  strategy: CompressionStrategy
  originalSize: number
  compressedSize: number
  compressionRatio: number
  quality: number // 0-1
  processingTime: number
}

interface CompressionResult {
  compressed: string
  metadata: CompressionMetadata
  reconstruction: ReconstructionInfo
}

interface CompressionMetadata {
  strategy: string
  originalTokens: number
  compressedTokens: number
  compressionRatio: number
  quality: number
  processingTime: number
}

interface ReconstructionInfo {
  fidelity: number // 0-1
  loss: number // 0-1
  criticalInfoPreserved: boolean
}
```

### User Interface Types

```typescript
// Analytics panel configuration
interface AnalyticsPanelConfig {
  enabled: boolean
  layout: PanelLayout
  sections: PanelSection[]
  suggestions: SuggestionsConfig
  insights: InsightsConfig
  prompts: PromptsConfig
  performance: PerformanceConfig
}

type PanelLayout = 'tabs' | 'sidebar' | 'grid' | 'stacked'

interface PanelSection {
  id: string
  title: string
  type: 'suggestions' | 'insights' | 'prompts' | 'history'
  visible: boolean
  order: number
  config: SectionConfig
}

interface SectionConfig {
  itemCount: number
  sortBy: SortCriteria
  filterBy: FilterCriteria[]
  groupBy?: GroupCriteria
  viewMode: ViewMode
}

type SortCriteria = 'priority' | 'popularity' | 'recent' | 'cost' | 'complexity'

type FilterCriteria = 'category' | 'complexity' | 'priority' | 'tags' | 'model'

type GroupCriteria = 'category' | 'complexity' | 'priority'

type ViewMode = 'list' | 'grid' | 'compact' | 'detailed'

interface SuggestionsConfig {
  autoGenerate: boolean
  refreshInterval: number
  maxSuggestions: number
  enableFiltering: boolean
  enableSorting: boolean
  enableGrouping: boolean
  showCost: boolean
  showComplexity: boolean
  showSuccessRate: boolean
}

interface InsightsConfig {
  autoGenerate: boolean
  refreshInterval: number
  maxInsights: number
  enableFiltering: boolean
  enableSorting: boolean
  enableGrouping: boolean
  showConfidence: boolean
  showImportance: boolean
  showVisualizations: boolean
}

interface PromptsConfig {
  templates: PromptTemplate[]
  customPrompts: CustomPrompt[]
  enableHistory: boolean
  maxHistoryItems: number
  enableSharing: boolean
  enableCloning: boolean
  enableEditing: boolean
}

interface CustomPrompt {
  id: string
  name: string
  description: string
  prompt: string
  variables: PromptVariable[]
  createdAt: number
  modifiedAt: number
  isPublic: boolean
  usageCount: number
  successRate: number
}

interface PerformanceConfig {
  showMetrics: boolean
  showCost: boolean
  showTokens: boolean
  showTiming: boolean
  refreshInterval: number
  enableOptimization: boolean
  enableCaching: boolean
}

// UI components
interface AnalyticsSuggestionCard {
  suggestion: AnalyticsSuggestion
  isSelected: boolean
  isExpanded: boolean
  onExecute: (suggestion: AnalyticsSuggestion) => void
  onExpand: (suggestion: AnalyticsSuggestion) => void
  onSelect: (suggestion: AnalyticsSuggestion) => void
}

interface InsightCardComponent {
  insight: InsightCard
  isExpanded: boolean
  onExpand: (insight: InsightCard) => void
  onAction: (action: InsightAction, insight: InsightCard) => void
}

type InsightAction = 'view-details' | 'export' | 'share' | 'delete' | 'regenerate'

interface PromptBuilderComponent {
  template: PromptTemplate
  variables: Record<string, any>
  onVariableChange: (name: string, value: any) => void
  onExecute: (prompt: string) => void
  onPreview: (prompt: string) => void
  onSave: (template: PromptTemplate) => void
}

interface ChatInterface {
  messages: ChatMessage[]
  isTyping: boolean
  onSendMessage: (message: string) => void
  onSuggestionClick: (suggestion: string) => void
  onToolUse: (toolCall: ToolCall) => void
  isLoading: boolean
  error: string | null
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}

interface ToolResult {
  toolCallId: string
  result: any
}
```

### Performance and Cost Types

```typescript
// Performance metrics
interface LLMPerformanceMetrics {
  requestCount: number
  successRate: number // 0-1
  averageResponseTime: number
  totalTokens: TokenUsage
  totalCost: number
  cacheHitRate: number // 0-1
  errorRate: number // 0-1
  modelUsage: ModelUsageStats[]
  timeSeries: PerformanceTimeSeries[]
}

interface ModelUsageStats {
  model: string
  requestCount: number
  tokens: TokenUsage
  cost: number
  averageResponseTime: number
  errorRate: number // 0-1
}

interface PerformanceTimeSeries {
  timestamp: number
  metrics: {
    requestCount: number
    responseTime: number
    tokens: TokenUsage
    cost: number
    errorCount: number
  }
}

// Cost analysis
interface CostAnalysis {
  totalCost: number
  breakdown: CostBreakdown
  optimization: CostOptimization
  projections: CostProjection[]
  budget: BudgetConfig
}

interface CostBreakdown {
  byModel: ModelCost[]
  byOperation: OperationCost[]
  byTime: TimeCost[]
  byUser: UserCost[]
}

interface ModelCost {
  model: string
  inputTokens: number
  outputTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  requestCount: number
}

interface OperationCost {
  operation: 'suggestion' | 'insight' | 'prompt' | 'chat'
  cost: number
  tokens: TokenUsage
  requestCount: number
}

interface TimeCost {
  period: 'hour' | 'day' | 'week' | 'month'
  cost: number
  tokens: TokenUsage
  requestCount: number
}

interface UserCost {
  user: string
  cost: number
  tokens: TokenUsage
  requestCount: number
}

interface CostOptimization {
  currentCost: number
  optimizedCost: number
  savings: number
  savingsPercentage: number
  strategies: OptimizationStrategy[]
}

interface OptimizationStrategy {
  name: string
  description: string
  potentialSavings: number
  implementation: string
  priority: Priority
  status: 'pending' | 'implementing' | 'implemented' | 'failed'
}

interface CostProjection {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  projectedCost: number
  confidence: number // 0-1
  factors: ProjectionFactor[]
}

interface ProjectionFactor {
  name: string
  impact: 'increase' | 'decrease'
  magnitude: number // percentage
  confidence: number // 0-1
}

interface BudgetConfig {
  monthly: number
  alerts: BudgetAlert[]
  thresholds: BudgetThreshold[]
}

interface BudgetAlert {
  type: 'warning' | 'critical'
  threshold: number // percentage of budget
  message: string
  action: string
}

interface BudgetThreshold {
  metric: 'daily' | 'weekly' | 'monthly'
  threshold: number
  action: 'alert' | 'block' | 'throttle'
}

// Cache management
interface CacheConfig {
  enabled: boolean
  maxSize: number
  ttl: number
  strategy: CacheStrategy
  compression: CacheCompression
}

type CacheStrategy = 'lru' | 'lfu' | 'fifo' | 'adaptive'

type CacheCompression = 'none' | 'gzip' | 'brotli'

interface CacheMetrics {
  hitRate: number // 0-1
  missRate: number // 0-1
  size: number
  itemCount: number
  evictionCount: number
  averageAccessTime: number
}

interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  size: number
  metadata: CacheMetadata
}

interface CacheMetadata {
  model: string
  prompt: string
  response: string
  tokens: TokenUsage
  cost: number
  responseTime: number
}
```

## Files

Single sentence describing file modifications.

Detailed breakdown:

- New files to be created (with full paths and purpose)
- Existing files to be modified (with specific changes)
- Files to be deleted or moved
- Configuration file updates

### New Files to Create

#### OpenRouter Integration

```
src/
├── integrations/
│   ├── openrouter/
│   │   ├── OpenRouterClient.ts      # Main OpenRouter API client
│   │   ├── OpenRouterConfig.ts     # Configuration management
│   │   ├── OpenRouterModels.ts     # Model information and selection
│   │   ├── OpenRouterCache.ts      # Response caching
│   │   ├── OpenRouterCost.ts       # Cost calculation and optimization
│   │   ├── OpenRouterError.ts      # Error handling and recovery
│   │   ├── OpenRouterStream.ts     # Streaming response handling
│   │   └── OpenRouterTools.ts      # Tool/function calling
│   └── types/
│       └── openrouter/
│           ├── OpenRouterTypes.ts   # Type definitions
│           ├── ModelTypes.ts        # Model-specific types
│           ├── RequestTypes.ts      # Request type definitions
│           └── ResponseTypes.ts     # Response type definitions
```

#### LLM Analytics

```
src/
├── analytics/
│   ├── engine/
│   │   ├── AnalyticsEngine.tsx     # Main analytics engine
│   │   ├── SuggestionEngine.tsx    # Suggestion generation engine
│   │   ├── InsightEngine.tsx       # Insight generation engine
│   │   └── PromptEngine.tsx        # Prompt processing engine
│   ├── prompts/
│   │   ├── PromptTemplates.ts      # Prompt template management
│   │   ├── PromptBuilder.tsx       # Interactive prompt builder
│   │   ├── PromptOptimizer.tsx     # Prompt optimization
│   │   └── PromptStrategies.tsx   # Prompt engineering strategies
│   ├── context/
│   │   ├── ContextManager.ts       # Data context management
│   │   ├── ContextCompression.ts   # Context compression
│   │   ├── ContextSampling.ts      # Context sampling strategies
│   │   └── ContextValidation.ts    # Context validation
│   ├── insights/
│   │   ├── InsightGenerator.tsx   # Insight generation
│   │   ├── InsightValidator.tsx   # Insight validation
│   │   ├── InsightVisualizer.tsx  # Insight visualization
│   │   └── InsightScoring.tsx     # Insight scoring and ranking
│   └── suggestions/
│       ├── SuggestionGenerator.tsx # Suggestion generation
│       ├── SuggestionMatcher.tsx  # Suggestion matching
│       ├── SuggestionRanker.tsx   # Suggestion ranking
│       └── SuggestionCache.ts      # Suggestion caching
```

#### UI Components

```
src/
├── components/
│   ├── analytics/
│   │   ├── AnalyticsPanel.tsx       # Main analytics panel
│   │   ├── SuggestionPanel.tsx     # Suggestions panel
│   │   ├── InsightPanel.tsx        # Insights panel
│   │   ├── PromptPanel.tsx         # Prompt panel
│   │   └── ChatPanel.tsx           # Chat interface
│   ├── cards/
│   │   ├── SuggestionCard.tsx      # Suggestion card
│   │   ├── InsightCard.tsx         # Insight card
│   │   ├── PromptCard.tsx          # Prompt card
│   │   └── ChatMessageCard.tsx     # Chat message card
│   ├── builders/
│   │   ├── PromptBuilder.tsx       # Prompt builder
│   │   ├── InsightBuilder.tsx      # Insight builder
│   │   └── SuggestionBuilder.tsx   # Suggestion builder
│   └── charts/
│       ├── InsightChart.tsx       # Insight visualization
│       ├── TrendChart.tsx          # Trend visualization
│       ├── CorrelationChart.tsx   # Correlation visualization
│       └── PredictionChart.tsx     # Prediction visualization
```

#### Hooks and Utilities

```
src/
├── hooks/
│   ├── useOpenRouter.ts            # OpenRouter integration hook
│   ├── useAnalytics.ts             # Analytics engine hook
│   ├── useSuggestions.ts           # Suggestions hook
│   ├── useInsights.ts              # Insights hook
│   ├── usePrompts.ts               # Prompts hook
│   ├── useChat.ts                  # Chat interface hook
│   ├── useContextManager.ts       # Context management hook
│   ├── usePromptBuilder.ts         # Prompt builder hook
│   ├── useCostAnalysis.ts          # Cost analysis hook
│   └── useCache.ts                 # Cache management hook
├── utils/
│   ├── analytics/
│   │   ├── promptEngineering.ts    # Prompt engineering utilities
│   │   ├── contextCompression.ts   # Context compression utilities
│   │   ├── insightGeneration.ts   # Insight generation utilities
│   │   ├── suggestionMatching.ts   # Suggestion matching utilities
│   │   └── costOptimization.ts    # Cost optimization utilities
│   └── validation/
│       ├── promptValidation.ts     # Prompt validation
│       ├── insightValidation.ts    # Insight validation
│       ├── dataValidation.ts       # Data validation
│       └── responseValidation.ts   # Response validation
```

#### Types and Interfaces

```
src/
├── types/
│   ├── analytics/
│   │   ├── AnalyticsTypes.ts       # Analytics type definitions
│   │   ├── PromptTypes.ts          # Prompt type definitions
│   │   ├── InsightTypes.ts         # Insight type definitions
│   │   ├── SuggestionTypes.ts     # Suggestion type definitions
│   │   └── ContextTypes.ts        # Context type definitions
│   ├── openrouter/
│   │   ├── OpenRouterConfig.ts     # OpenRouter configuration types
│   │   ├── OpenRouterModels.ts     # OpenRouter model types
│   │   ├── OpenRouterRequests.ts  # OpenRouter request types
│   │   ├── OpenRouterResponses.ts # OpenRouter response types
│   │   └── OpenRouterTools.ts     # OpenRouter tools types
│   └── ui/
│       ├── AnalyticsPanel.ts      # Analytics panel types
│       ├── CardComponents.ts      # Card component types
│       ├── BuilderComponents.ts   # Builder component types
│       └── ChartComponents.ts     # Chart component types
```

### Existing Files to Modify

#### src/hooks/useLLMAnalytics.ts

**Changes**:

- Replace basic OpenRouter integration with advanced client
- Add prompt engineering capabilities
- Implement context management
- Add cost optimization and caching

**New approach**:

```typescript
export function useLLMAnalytics(excelData: ExcelData | null, options: LLMAnalyticsOptions = {}) {
  const openRouter = useOpenRouter()
  const contextManager = useContextManager()
  const analyticsEngine = useAnalyticsEngine()
  const costAnalyzer = useCostAnalysis()

  const generateSuggestion = useCallback(
    async (template: string, variables: Record<string, any>) => {
      const context = await contextManager.buildContext(excelData, {
        strategy: options.contextStrategy || 'adaptive',
        maxTokens: options.maxContextTokens || 4000,
      })

      const prompt = await promptEngine.buildPrompt(template, {
        variables,
        context,
        model: options.model || 'gpt-4',
      })

      const response = await openRouter.generateCompletion({
        model: options.model || 'gpt-4',
        prompt,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        stream: false,
      })

      costAnalyzer.recordUsage(response.usage, response.model)

      return response
    },
    [openRouter, contextManager, promptEngine, costAnalyzer, excelData, options],
  )

  const generateInsight = useCallback(
    async (analysisType: InsightType, options: InsightOptions = {}) => {
      const context = await contextManager.buildContext(excelData, {
        strategy: 'full',
        includeStatistics: true,
        includeSchema: true,
      })

      const insight = await analyticsEngine.generateInsight({
        type: analysisType,
        context,
        model: options.model || 'gpt-4',
        temperature: options.temperature || 0.3,
      })

      costAnalyzer.recordUsage(insight.metadata.tokensUsed, insight.metadata.model)

      return insight
    },
    [contextManager, analyticsEngine, costAnalyzer, excelData],
  )

  return {
    generateSuggestion,
    generateInsight,
    // ... other optimized functions
  }
}
```

#### src/components/analytics/AnalyticsPanel.tsx

**Changes**:

- Replace basic UI with advanced analytics interface
- Add prompt builder component
- Implement real-time suggestions and insights
- Add cost monitoring and optimization

**Enhanced component**:

```typescript
export function AnalyticsPanel({
  excelData,
  filters,
  onAddChart,
  onUpdateChart,
}: AnalyticsPanelProps) {
  const { suggestions, insights, generateSuggestion, generateInsight } = useLLMAnalytics(excelData);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights' | 'prompts' | 'chat'>('suggestions');
  const [selectedSuggestion, setSelectedSuggestion] = useState<AnalyticsSuggestion | null>(null);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false);

  return (
    <div className="analytics-panel">
      <div className="analytics-tabs">
        <TabButton active={activeTab === 'suggestions'} onClick={() => setActiveTab('suggestions')}>
          Suggestions
        </TabButton>
        <TabButton active={activeTab === 'insights'} onClick={() => setActiveTab('insights')}>
          Insights
        </TabButton>
        <TabButton active={activeTab === 'prompts'} onClick={() => setActiveTab('prompts')}>
          Prompts
        </TabButton>
        <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
          Chat
        </TabButton>
      </div>

      <div className="analytics-content">
        {activeTab === 'suggestions' && (
          <SuggestionPanel
            suggestions={suggestions}
            onSelect={setSelectedSuggestion}
            onExecute={handleSuggestionExecute}
            onPromptBuilder={() => setPromptBuilderOpen(true)}
          />
        )}

        {activeTab === 'insights' && (
          <InsightPanel
            insights={insights}
            onAction={handleInsightAction}
            onGenerate={handleGenerateInsight}
          />
        )}

        {activeTab === 'prompts' && (
          <PromptPanel
            templates={promptTemplates}
            onExecute={handlePromptExecute}
            onBuilder={() => setPromptBuilderOpen(true)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatPanel
            onSendMessage={handleChatMessage}
            onSuggestionClick={handleSuggestionClick}
            onToolUse={handleToolUse}
          />
        )}
      </div>

      {selectedSuggestion && (
        <SuggestionDetails
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onExecute={handleSuggestionExecute}
        />
      )}

      {promptBuilderOpen && (
        <PromptBuilderModal
          excelData={excelData}
          onClose={() => setPromptBuilderOpen(false)}
          onExecute={handlePromptExecute}
        />
      )}

      <CostMonitor />
    </div>
  );
}
```

#### src/services/excelParser.ts

**Changes**:

- Add data quality analysis
- Implement schema inference
- Add statistics calculation
- Support data context generation for LLM

**Enhanced service**:

```typescript
export class ExcelParser {
  // ... existing methods

  async parseWithAnalytics(file: File, options: ParseOptions = {}): Promise<ExcelData> {
    const data = await this.parseFile(file, options)

    // Add analytics metadata
    const analytics = await this.generateAnalyticsMetadata(data)

    return {
      ...data,
      metadata: {
        ...data.metadata,
        analytics,
      },
    }
  }

  private async generateAnalyticsMetadata(data: ExcelData): Promise<AnalyticsMetadata> {
    const schema = this.inferSchema(data)
    const statistics = this.calculateStatistics(data)
    const quality = this.assessDataQuality(data)
    const context = this.generateDataContext(data)

    return {
      schema,
      statistics,
      quality,
      context,
      generatedAt: Date.now(),
    }
  }

  private inferSchema(data: ExcelData): DataSchema {
    // Implement schema inference
  }

  private calculateStatistics(data: ExcelData): DataStatistics {
    // Implement statistics calculation
  }

  private assessDataQuality(data: ExcelData): DataQuality {
    // Implement data quality assessment
  }

  private generateDataContext(data: ExcelData): DataContext {
    // Implement data context generation
  }
}
```

### Files to Delete or Move

- **Delete**: Basic OpenRouter integration files
- **Move**: Simple prompt templates to new prompt engine
- **Delete**: Basic analytics components
- **Move**: Simple chat interface to new chat panel

### Configuration Files to Update

#### tsconfig.json

**Changes**:

- Add path aliases for new OpenRouter and analytics modules
- Enable strict mode for OpenRouter types
- Add experimental decorators support

**New paths**:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/integrations/openrouter/*": ["./src/integrations/openrouter/*"],
      "@/analytics/*": ["./src/analytics/*"],
      "@/components/analytics/*": ["./src/components/analytics/*"],
      "@/hooks/analytics/*": ["./src/hooks/analytics/*"],
      "@/utils/analytics/*": ["./src/utils/analytics/*"],
      "@/types/openrouter/*": ["./src/types/openrouter/*"],
      "@/types/analytics/*": ["./src/types/analytics/*"]
    },
    "experimentalDecorators": true,
    "strict": true
  }
}
```

#### package.json

**Changes**:

- Add OpenRouter and LLM analytics dependencies
- Update existing dependencies for better performance
- Add development dependencies for testing

**New dependencies**:

```json
{
  "dependencies": {
    "openai": "^4.20.1",
    "@anthropic-ai/sdk": "^0.8.1",
    "cohere-ai": "^6.0.0",
    "zod": "^3.22.2",
    "json-schema": "^0.4.0",
    "lodash": "^4.17.21",
    "date-fns": "^2.30.0",
    "recharts": "^2.8.0",
    "react-query": "^3.39.3",
    "swr": "^2.2.4"
  },
  "devDependencies": {
    "@types/openai": "^3.2.4",
    "@types/lodash": "^4.14.199",
    "@types/json-schema": "^7.0.12",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "msw": "^1.3.2",
    "fake-indexeddb": "^5.0.1"
  }
}
```

## Functions

Single sentence describing function modifications.

Detailed breakdown:

- New functions (name, signature, file path, purpose)
- Modified functions (exact name, current file path, required changes)
- Removed functions (name, file path, reason, migration strategy)

### New Functions to Create

#### OpenRouter Integration Functions

```typescript
// src/integrations/openrouter/OpenRouterClient.ts
export function createOpenRouterClient(config: OpenRouterConfig): OpenRouterClient
export function useOpenRouter(): OpenRouterClient
export function OpenRouterProvider({ children, config }: OpenRouterProviderProps): JSX.Element

// src/integrations/openrouter/OpenRouterModels.ts
export function getAvailableModels(): OpenRouterModel[]
export function getModelById(id: string): OpenRouterModel | undefined
export function getModelsByCategory(category: ModelCategory): OpenRouterModel[]
export function selectOptimalModel(requirements: ModelRequirements): OpenRouterModel

// src/integrations/openrouter/OpenRouterCache.ts
export function createResponseCache(config: CacheConfig): ResponseCache
export function useResponseCache(): ResponseCache
export function cacheResponse(key: string, response: OpenRouterResponse): void
export function getCachedResponse(key: string): OpenRouterResponse | undefined

// src/integrations/openrouter/OpenRouterCost.ts
export function calculateCost(usage: TokenUsage, model: string): number
export function optimizeModelSelection(requests: OpenRouterRequest[]): ModelOptimization
export function useCostAnalysis(): CostAnalysis
export function setBudgetAlerts(alerts: BudgetAlert[]): void

// src/integrations/openrouter/OpenRouterTools.ts
export function createTool(functionDefinition: FunctionDefinition): Tool
export function executeToolCall(toolCall: ToolCall, context: DataContext): Promise<any>
export function validateToolResult(result: any, toolCall: ToolCall): boolean
```

#### Analytics Engine Functions

```typescript
// src/analytics/engine/AnalyticsEngine.tsx
export function createAnalyticsEngine(config: AnalyticsEngineConfig): AnalyticsEngine
export function useAnalyticsEngine(): AnalyticsEngine
export function AnalyticsEngineProvider({ children }: AnalyticsEngineProviderProps): JSX.Element

// src/analytics/engine/SuggestionEngine.tsx
export function generateSuggestions(
  context: DataContext,
  requirements: SuggestionRequirements,
): Promise<AnalyticsSuggestion[]>
export function rankSuggestions(
  suggestions: AnalyticsSuggestion[],
  criteria: RankingCriteria,
): AnalyticsSuggestion[]
export function matchSuggestionsToData(
  suggestions: AnalyticsSuggestion[],
  data: DataContext,
): MatchResult[]

// src/analytics/engine/InsightEngine.tsx
export function generateInsights(
  context: DataContext,
  analysisTypes: InsightType[],
): Promise<InsightCard[]>
export function validateInsight(insight: InsightCard): ValidationReport
export function scoreInsight(insight: InsightCard): number
export function visualizeInsight(insight: InsightCard): VisualizationConfig[]

// src/analytics/engine/PromptEngine.tsx
export function buildPrompt(template: string, variables: PromptVariables): Promise<string>
export function optimizePrompt(prompt: string, model: string): Promise<OptimizedPrompt>
export function validatePrompt(prompt: string): ValidationReport
export function extractPromptVariables(prompt: string): PromptVariable[]
```

#### Context Management Functions

```typescript
// src/analytics/context/ContextManager.ts
export function createDataContext(data: ExcelData): DataContext
export function compressContext(
  context: DataContext,
  strategy: CompressionStrategy,
): Promise<CompressedContext>
export function sampleContext(context: DataContext, strategy: SamplingStrategy): SampledContext
export function validateContext(context: DataContext): ValidationReport

// src/analytics/context/ContextCompression.ts
export function compressWithSemanticCompression(context: DataContext): Promise<CompressedContext>
export function compressWithStatisticalCompression(context: DataContext): Promise<CompressedContext>
export function decompressContext(compressed: CompressedContext): Promise<DataContext>
export function calculateCompressionQuality(
  original: DataContext,
  compressed: CompressedContext,
): number

// src/analytics/context/ContextSampling.ts
export function sampleRandomly(context: DataContext, sampleSize: number): SampledContext
export function sampleStratified(context: DataContext, strata: string[]): SampledContext
export function sampleAdaptively(context: DataContext, complexity: number): SampledContext
export function calculateSampleRepresentativeness(
  sample: SampledContext,
  original: DataContext,
): number
```

#### UI Component Functions

```typescript
// src/components/analytics/AnalyticsPanel.tsx
export function AnalyticsPanel(props: AnalyticsPanelProps): JSX.Element
export function useAnalyticsPanel(): AnalyticsPanelContext

// src/components/analytics/SuggestionPanel.tsx
export function SuggestionPanel(props: SuggestionPanelProps): JSX.Element
export function SuggestionCard(props: SuggestionCardProps): JSX.Element

// src/components/analytics/InsightPanel.tsx
export function InsightPanel(props: InsightPanelProps): JSX.Element
export function InsightCard(props: InsightCardProps): JSX.Element

// src/components/analytics/PromptPanel.tsx
export function PromptPanel(props: PromptPanelProps): JSX.Element
export function PromptCard(props: PromptCardProps): JSX.Element

// src/components/analytics/ChatPanel.tsx
export function ChatPanel(props: ChatPanelProps): JSX.Element
export function ChatMessage(props: ChatMessageProps): JSX.Element
```

#### Hook Functions

```typescript
// src/hooks/useOpenRouter.ts
export function useOpenRouter(): OpenRouterClient
export function useModelSelection(requirements: ModelRequirements): OpenRouterModel
export function useStreamingCompletion(prompt: string, options: StreamingOptions): StreamingResult

// src/hooks/useAnalytics.ts
export function useAnalytics(excelData: ExcelData | null): AnalyticsContext
export function useSuggestions(context: DataContext): AnalyticsSuggestion[]
export function useInsights(context: DataContext): InsightCard[]
export function usePromptExecution(prompt: string, variables: Record<string, any>): Promise<string>

// src/hooks/useContextManager.ts
export function useContextManager(data: ExcelData | null): ContextManager
export function useContextCompression(): ContextCompression
export function useContextSampling(): ContextSampling

// src/hooks/usePromptBuilder.ts
export function usePromptBuilder(template: PromptTemplate | null): PromptBuilderContext
export function usePromptOptimization(prompt: string): OptimizedPrompt
export function usePromptValidation(prompt: string): ValidationReport

// src/hooks/useCostAnalysis.ts
export function useCostAnalysis(): CostAnalysis
export function useBudgetAlerts(): BudgetAlert[]
export function useCostOptimization(): CostOptimization

// src/hooks/useCache.ts
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions,
): CacheResult<T>
export function useCacheInvalidation(): CacheInvalidation
export function useCacheMetrics(): CacheMetrics
```

#### Utility Functions

```typescript
// src/utils/analytics/promptEngineering.ts
export function createChainOfThoughtPrompt(task: string, context: DataContext): string
export function createFewShotPrompt(task: string, examples: Example[]): string
export function createRolePlayingPrompt(role: string, task: string): string
export function createStepByStepPrompt(task: string, steps: string[]): string
export function optimizePromptForModel(prompt: string, model: string): OptimizedPrompt

// src/utils/analytics/insightGeneration.ts
export function generateTrendInsight(data: DataContext): InsightCard
export function generateCorrelationInsight(data: DataContext): InsightCard
export function generateAnomalyInsight(data: DataContext): InsightCard
export function generatePredictionInsight(data: DataContext): InsightCard
export function generateSummaryInsight(data: DataContext): InsightCard

// src/utils/analytics/suggestionMatching.ts
export function matchSuggestionToData(
  suggestion: AnalyticsSuggestion,
  data: DataContext,
): MatchScore
export function rankSuggestionsByRelevance(
  suggestions: AnalyticsSuggestion[],
  data: DataContext,
): AnalyticsSuggestion[]
export function filterSuggestionsByFeasibility(
  suggestions: AnalyticsSuggestion[],
  data: DataContext,
): AnalyticsSuggestion[]

// src/utils/analytics/costOptimization.ts
export function optimizeModelSelectionForCost(requests: OpenRouterRequest[]): ModelOptimization
export function calculateCostSavings(current: CostAnalysis, optimized: CostAnalysis): number
export function generateCostOptimizationStrategies(costs: CostAnalysis): OptimizationStrategy[]
export function projectFutureCosts(
  current: CostAnalysis,
  factors: ProjectionFactor[],
): CostProjection[]

// src/utils/validation/promptValidation.ts
export function validatePromptStructure(prompt: string): StructureValidation
export function validatePromptVariables(
  prompt: string,
  variables: PromptVariable[],
): VariableValidation
export function validatePromptLength(prompt: string, model: string): LengthValidation
export function validatePromptContent(prompt: string): ContentValidation
```

### Modified Functions

#### src/hooks/useLLMAnalytics.ts - Main analytics hook

**Current file**: src/hooks/useLLMAnalytics.ts
**Required changes**:

- Replace basic OpenRouter calls with advanced client
- Add context management and compression
- Implement prompt engineering strategies
- Add cost optimization and caching

**Enhanced hook**:

```typescript
// src/hooks/useLLMAnalytics.ts
export function useLLMAnalytics(excelData: ExcelData | null, options: LLMAnalyticsOptions = {}) {
  const openRouter = useOpenRouter()
  const contextManager = useContextManager()
  const analyticsEngine = useAnalyticsEngine()
  const costAnalyzer = useCostAnalysis()
  const cache = useCache()

  const generateSuggestion = useCallback(
    async (template: string, variables: Record<string, any> = {}) => {
      const cacheKey = `suggestion_${template}_${JSON.stringify(variables)}`

      // Check cache first
      const cached = await cache.get(cacheKey)
      if (cached) {
        return cached
      }

      // Build context with compression
      const context = await contextManager.buildContext(excelData, {
        strategy: options.contextStrategy || 'adaptive',
        maxTokens: options.maxContextTokens || 4000,
        compression: options.enableCompression,
      })

      // Build optimized prompt
      const prompt = await analyticsEngine.buildPrompt(template, {
        variables,
        context,
        model: options.model || 'gpt-4',
        optimization: true,
      })

      // Generate completion with cost optimization
      const response = await openRouter.generateCompletion({
        model: options.model || 'gpt-4',
        prompt,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        stream: false,
        costOptimization: true,
      })

      // Record usage and cost
      costAnalyzer.recordUsage(response.usage, response.model)

      // Cache result
      await cache.set(cacheKey, response, {
        ttl: options.cacheTTL || 3600,
      })

      return response
    },
    [openRouter, contextManager, analyticsEngine, costAnalyzer, cache, excelData, options],
  )

  const generateInsight = useCallback(
    async (analysisType: InsightType, insightOptions: InsightOptions = {}) => {
      const context = await contextManager.buildContext(excelData, {
        strategy: 'full',
        includeStatistics: true,
        includeSchema: true,
        compression: true,
      })

      const insight = await analyticsEngine.generateInsight({
        type: analysisType,
        context,
        model: insightOptions.model || 'gpt-4',
        temperature: insightOptions.temperature || 0.3,
        visualization: insightOptions.includeVisualization,
      })

      costAnalyzer.recordUsage(insight.metadata.tokensUsed, insight.metadata.model)

      return insight
    },
    [contextManager, analyticsEngine, costAnalyzer, excelData],
  )

  const executePrompt = useCallback(
    async (prompt: string, variables: Record<string, any> = {}) => {
      const optimizedPrompt = await analyticsEngine.optimizePrompt(prompt, options.model || 'gpt-4')

      const response = await openRouter.generateCompletion({
        model: options.model || 'gpt-4',
        prompt: optimizedPrompt.prompt,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        stream: options.streaming || false,
      })

      costAnalyzer.recordUsage(response.usage, response.model)

      return {
        response,
        optimization: optimizedPrompt.optimization,
      }
    },
    [openRouter, analyticsEngine, costAnalyzer, options],
  )

  return {
    generateSuggestion,
    generateInsight,
    executePrompt,
    suggestions: analyticsEngine.suggestions,
    insights: analyticsEngine.insights,
    costAnalysis: costAnalyzer.analysis,
    context: contextManager.context,
  }
}
```

#### src/components/analytics/AnalyticsPanel.tsx - Main panel component

**Current file**: src/components/analytics/AnalyticsPanel.tsx
**Required changes**:

- Replace basic UI with advanced tabbed interface
- Add prompt builder and chat functionality
- Implement real-time cost monitoring
- Add suggestion and insight management

**Enhanced component**:

```typescript
// src/components/analytics/AnalyticsPanel.tsx
export function AnalyticsPanel({
  excelData,
  filters,
  onAddChart,
  onUpdateChart,
}: AnalyticsPanelProps) {
  const {
    suggestions,
    insights,
    generateSuggestion,
    generateInsight,
    executePrompt,
    costAnalysis,
  } = useLLMAnalytics(excelData);

  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights' | 'prompts' | 'chat'>('suggestions');
  const [selectedSuggestion, setSelectedSuggestion] = useState<AnalyticsSuggestion | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<InsightCard | null>(null);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleSuggestionExecute = useCallback(async (suggestion: AnalyticsSuggestion) => {
    try {
      const result = await generateSuggestion(suggestion.prompt, {
        dataContext: excelData,
        filters,
      });

      // Handle suggestion result (e.g., create chart, show insight)
      onAddChart?.(result.chartConfig);
    } catch (error) {
      console.error('Error executing suggestion:', error);
    }
  }, [generateSuggestion, excelData, filters, onAddChart]);

  const handlePromptExecute = useCallback(async (prompt: string, variables: Record<string, any>) => {
    try {
      const result = await executePrompt(prompt, variables);

      // Add to chat history
      setChatMessages(prev => [...prev, {
        id: uuid(),
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      }, {
        id: uuid(),
        role: 'assistant',
        content: result.response,
        timestamp: Date.now(),
      }]);
    } catch (error) {
      console.error('Error executing prompt:', error);
    }
  }, [executePrompt]);

  const handleChatMessage = useCallback(async (message: string) => {
    setChatMessages(prev => [...prev, {
      id: uuid(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }]);

    try {
      const response = await executePrompt(message, {
        chatHistory: chatMessages,
        currentData: excelData,
        filters,
      });

      setChatMessages(prev => [...prev, {
        id: uuid(),
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
      }]);
    } catch (error) {
      console.error('Error in chat:', error);
    }
  }, [executePrompt, chatMessages, excelData, filters]);

  return (
    <div className="analytics-panel h-full flex flex-col">
      {/* Cost Monitor */}
      <CostMonitor costAnalysis={costAnalysis} />

      {/* Tabs */}
      <div className="analytics-tabs flex border-b">
        {(['suggestions', 'insights', 'prompts', 'chat'] as const).map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="analytics-content flex-1 overflow-auto">
        {activeTab === 'suggestions' && (
          <SuggestionPanel
            suggestions={suggestions}
            onSelect={setSelectedSuggestion}
            onExecute={handleSuggestionExecute}
            onPromptBuilder={() => setPromptBuilderOpen(true)}
          />
        )}

        {activeTab === 'insights' && (
          <InsightPanel
            insights={insights}
            onSelect={setSelectedInsight}
            onGenerate={(type) => generateInsight(type)}
          />
        )}

        {activeTab === 'prompts' && (
          <PromptPanel
            templates={promptTemplates}
            onExecute={handlePromptExecute}
            onBuilder={() => setPromptBuilderOpen(true)}
          />
        )}

        {activeTab === 'chat' && (
          <ChatPanel
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            onSuggestionClick={(suggestion) => handlePromptExecute(suggestion.prompt, {})}
            isLoading={false}
          />
        )}
      </div>

      {/* Modals */}
      {selectedSuggestion && (
        <SuggestionDetailsModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
          onExecute={handleSuggestionExecute}
        />
      )}

      {selectedInsight && (
        <InsightDetailsModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />
      )}

      {promptBuilderOpen && (
        <PromptBuilderModal
          excelData={excelData}
          onClose={() => setPromptBuilderOpen(false)}
          onExecute={handlePromptExecute}
        />
      )}
    </div>
  );
}
```

### Removed Functions

#### src/hooks/useLLMAnalytics.ts - Basic LLM functions

**Current file**: src/hooks/useLLMAnalytics.ts
**Reason**: Replaced with advanced OpenRouter integration and analytics engine
**Migration strategy**:

- Use new generateSuggestion function with context management
- Use new generateInsight function with validation
- Use new executePrompt function with optimization

**Functions to remove**:

- `basicLLMCall()` → Replace with generateSuggestion
- `simplePromptExecution()` → Replace with executePrompt
- `basicInsightGeneration()` → Replace with generateInsight

#### src/components/analytics/AnalyticsPanel.tsx - Basic UI functions

**Current file**: src/components/analytics/AnalyticsPanel.tsx
**Reason**: Replaced with advanced tabbed interface and components
**Migration strategy**:

- Use new SuggestionPanel component
- Use new InsightPanel component
- Use new PromptPanel and ChatPanel components

**Functions to remove**:

- `renderBasicSuggestions()` → Replace with SuggestionPanel
- `renderBasicInsights()` → Replace with InsightPanel
- `renderBasicChat()` → Replace with ChatPanel

## Classes

Single sentence describing class modifications.

Detailed breakdown:

- New classes (name, file path, key methods, inheritance)
- Modified classes (exact name, file path, specific modifications)
- Removed classes (name, file path, replacement strategy)

### New Classes to Create

#### OpenRouter Integration Classes

```typescript
// src/integrations/openrouter/OpenRouterClient.ts
export class OpenRouterClient {
  private config: OpenRouterConfig
  private cache: ResponseCache
  private costAnalyzer: CostAnalyzer
  private retryHandler: RetryHandler

  constructor(config: OpenRouterConfig) {
    this.config = config
    this.cache = new ResponseCache(config.cache)
    this.costAnalyzer = new CostAnalyzer()
    this.retryHandler = new RetryHandler(config.retryAttempts, config.retryDelay)
  }

  async generateCompletion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const cacheKey = this.generateCacheKey(request)

    // Check cache
    const cached = await this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Optimize model selection
    const optimizedRequest = await this.optimizeRequest(request)

    // Make API call with retry logic
    const response = await this.retryHandler.execute(() => this.makeAPICall(optimizedRequest))

    // Record cost
    this.costAnalyzer.recordUsage(response.usage, response.model)

    // Cache response
    await this.cache.set(cacheKey, response)

    return response
  }

  async generateStreamingCompletion(
    request: OpenRouterRequest,
  ): Promise<AsyncIterable<OpenRouterResponse>> {
    const optimizedRequest = await this.optimizeRequest(request)

    return this.makeStreamingAPICall(optimizedRequest)
  }

  private generateCacheKey(request: OpenRouterRequest): string
  private async optimizeRequest(request: OpenRouterRequest): Promise<OpenRouterRequest>
  private async makeAPICall(request: OpenRouterRequest): Promise<OpenRouterResponse>
  private async makeStreamingAPICall(
    request: OpenRouterRequest,
  ): Promise<AsyncIterable<OpenRouterResponse>>
  private async handleAPIError(error: Error): Promise<never>

  private config: OpenRouterConfig
  private cache: ResponseCache
  private costAnalyzer: CostAnalyzer
  private retryHandler: RetryHandler
}

// src/integrations/openrouter/OpenRouterModels.ts
export class OpenRouterModelManager {
  private models: Map<string, OpenRouterModel>
  private categories: Map<ModelCategory, OpenRouterModel[]>

  constructor() {
    this.models = new Map()
    this.categories = new Map()
    this.initializeModels()
  }

  getAvailableModels(): OpenRouterModel[] {
    return Array.from(this.models.values())
  }

  getModelById(id: string): OpenRouterModel | undefined {
    return this.models.get(id)
  }

  getModelsByCategory(category: ModelCategory): OpenRouterModel[] {
    return this.categories.get(category) || []
  }

  selectOptimalModel(requirements: ModelRequirements): OpenRouterModel {
    const candidates = this.filterModelsByRequirements(requirements)
    return this.rankModelsBySuitability(candidates, requirements)[0]
  }

  private initializeModels(): void
  private filterModelsByRequirements(requirements: ModelRequirements): OpenRouterModel[]
  private rankModelsBySuitability(
    models: OpenRouterModel[],
    requirements: ModelRequirements,
  ): OpenRouterModel[]
  private calculateModelScore(model: OpenRouterModel, requirements: ModelRequirements): number

  private models: Map<string, OpenRouterModel>
  private categories: Map<ModelCategory, OpenRouterModel[]>
}

// src/integrations/openrouter/OpenRouterCache.ts
export class ResponseCache {
  private cache: Map<string, CacheEntry<OpenRouterResponse>>
  private config: CacheConfig
  private compression: CacheCompression

  constructor(config: CacheConfig) {
    this.cache = new Map()
    this.config = config
    this.compression = new CacheCompression(config.compression)
  }

  async get(key: string): Promise<OpenRouterResponse | undefined> {
    const entry = this.cache.get(key)
    if (!entry) {
      return undefined
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return undefined
    }

    // Update access metadata
    entry.accessCount++
    entry.lastAccessed = Date.now()

    return entry.value
  }

  async set(key: string, value: OpenRouterResponse, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.config.ttl
    const compressed = await this.compression.compress(value)

    const entry: CacheEntry<OpenRouterResponse> = {
      key,
      value,
      compressed,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: compressed.size,
    }

    this.cache.set(key, entry)
    this.evictIfNeeded()
  }

  private isExpired(entry: CacheEntry<OpenRouterResponse>): boolean
  private evictIfNeeded(): void
  private getEvictionCandidates(): CacheEntry<OpenRouterResponse>[]
  private evictByLRU(candidates: CacheEntry<OpenRouterResponse>[]): void
  private evictByLFU(candidates: CacheEntry<OpenRouterResponse>[]): void

  private cache: Map<string, CacheEntry<OpenRouterResponse>>
  private config: CacheConfig
  private compression: CacheCompression
}
```

#### Analytics Engine Classes

```typescript
// src/analytics/engine/AnalyticsEngine.tsx
export class AnalyticsEngine extends React.Component<AnalyticsEngineProps, AnalyticsEngineState> {
  private suggestionEngine: SuggestionEngine;
  private insightEngine: InsightEngine;
  private promptEngine: PromptEngine;
  private contextManager: ContextManager;

  constructor(props: AnalyticsEngineProps) {
    super(props);
    this.suggestionEngine = new SuggestionEngine();
    this.insightEngine = new InsightEngine();
    this.promptEngine = new PromptEngine();
    this.contextManager = new ContextManager();

    this.state = {
      suggestions: [],
      insights: [],
      isGenerating: false,
      error: null,
    };
  }

  componentDidMount(): void {
    this.initializeAnalytics();
  }

  componentDidUpdate(prevProps: AnalyticsEngineProps) {
    if (prevProps.data !== this.props.data) {
      this.updateAnalytics();
    }
  }

  render(): React.ReactNode {
    const { children } = this.props;
    const { suggestions, insights, isGenerating, error } = this.state;

    return (
      <AnalyticsContext.Provider value={{
        suggestions,
        insights,
        isGenerating,
        error,
        generateSuggestion: this.generateSuggestion,
        generateInsight: this.generateInsight,
        buildPrompt: this.buildPrompt,
        optimizePrompt: this.optimizePrompt,
      }}>
        {children}
      </AnalyticsContext.Provider>
    );
  }

  private async initializeAnalytics(): void;
  private async updateAnalytics(): void;
  private generateSuggestion = async (template: string, variables: Record<string, any>): Promise<string>;
  private generateInsight = async (options: InsightOptions): Promise<InsightCard>;
  private buildPrompt = async (template: string, options: PromptOptions): Promise<string>;
  private optimizePrompt = async (prompt: string): Promise<OptimizedPrompt>;
  private handleError(error: Error): void;

  private suggestionEngine: SuggestionEngine;
  private insightEngine: InsightEngine;
  private promptEngine: PromptEngine;
  private contextManager: ContextManager;
}

// src/analytics/engine/SuggestionEngine.tsx
export class SuggestionEngine {
  private templates: Map<string, AnalyticsPromptConfig>;
  private matcher: SuggestionMatcher;
  private ranker: SuggestionRanker;

  constructor() {
    this.templates = new Map();
    this.matcher = new SuggestionMatcher();
    this.ranker = new SuggestionRanker();
    this.initializeTemplates();
  }

  async generateSuggestions(context: DataContext): Promise<AnalyticsSuggestion[]> {
    const candidates = await this.generateCandidateSuggestions(context);
    const matches = await this.matcher.matchToContext(candidates, context);
    const ranked = await this.ranker.rankByRelevance(matches, context);

    return ranked;
  }

  private async generateCandidateSuggestions(context: DataContext): Promise<AnalyticsSuggestion[]>;
  private initializeTemplates(): void;

  private templates: Map<string, AnalyticsPromptConfig>;
  private matcher: SuggestionMatcher;
  private ranker: SuggestionRanker;
}

// src/analytics/engine/InsightEngine.tsx
export class InsightEngine {
  private generators: Map<InsightType, InsightGenerator>;
  private validator: InsightValidator;
  private visualizer: InsightVisualizer;

  constructor() {
    this.generators = new Map();
    this.validator = new InsightValidator();
    this.visualizer = new InsightVisualizer();
    this.initializeGenerators();
  }

  async generateInsights(context: DataContext, types: InsightType[]): Promise<InsightCard[]> {
    const insights: InsightCard[] = [];

    for (const type of types) {
      const generator = this.generators.get(type);
      if (generator) {
        const insight = await generator.generate(context);
        const validation = await this.validator.validate(insight);

        if (validation.isValid) {
          const visualizations = await this.visualizer.createVisualizations(insight);
          insights.push({
            ...insight,
            visualizations,
            confidence: validation.confidence,
          });
        }
      }
    }

    return insights;
  }

  private initializeGenerators(): void;

  private generators: Map<InsightType, InsightGenerator>;
  private validator: InsightValidator;
  private visualizer: InsightVisualizer;
}
```

#### Context Management Classes

```typescript
// src/analytics/context/ContextManager.ts
export class ContextManager {
  private dataContext: DataContext | null
  private compression: ContextCompression
  private sampling: ContextSampling
  private validation: ContextValidation

  constructor() {
    this.dataContext = null
    this.compression = new ContextCompression()
    this.sampling = new ContextSampling()
    this.validation = new ContextValidation()
  }

  async buildContext(data: ExcelData, options: ContextOptions): Promise<DataContext> {
    // Create basic context
    const context = this.createDataContext(data)

    // Apply compression if needed
    if (options.compression) {
      context = await this.compression.compress(context, options.compressionStrategy)
    }

    // Apply sampling if needed
    if (options.maxTokens && this.estimateTokenCount(context) > options.maxTokens) {
      context = await this.sampling.sample(context, {
        strategy: options.samplingStrategy || 'adaptive',
        targetTokens: options.maxTokens,
      })
    }

    // Validate context
    const validation = await this.validation.validate(context)
    if (!validation.isValid) {
      throw new Error(`Invalid context: ${validation.errors.join(', ')}`)
    }

    this.dataContext = context
    return context
  }

  private createDataContext(data: ExcelData): DataContext
  private estimateTokenCount(context: DataContext): number

  private dataContext: DataContext | null
  private compression: ContextCompression
  private sampling: ContextSampling
  private validation: ContextValidation
}

// src/analytics/context/ContextCompression.ts
export class ContextCompression {
  private strategies: Map<CompressionStrategy, CompressionStrategy>

  constructor() {
    this.strategies = new Map()
    this.initializeStrategies()
  }

  async compress(
    context: DataContext,
    strategy: CompressionStrategy = 'semantic',
  ): Promise<DataContext> {
    const compressionStrategy = this.strategies.get(strategy)
    if (!compressionStrategy) {
      throw new Error(`Unknown compression strategy: ${strategy}`)
    }

    return compressionStrategy.compress(context)
  }

  private initializeStrategies(): void

  private strategies: Map<CompressionStrategy, CompressionStrategy>
}

// src/analytics/context/ContextSampling.ts
export class ContextSampling {
  private strategies: Map<SamplingStrategy, SamplingStrategy>

  constructor() {
    this.strategies = new Map()
    this.initializeStrategies()
  }

  async sample(context: DataContext, options: SamplingOptions): Promise<DataContext> {
    const samplingStrategy = this.strategies.get(options.strategy)
    if (!samplingStrategy) {
      throw new Error(`Unknown sampling strategy: ${options.strategy}`)
    }

    return samplingStrategy.sample(context, options)
  }

  private initializeStrategies(): void

  private strategies: Map<SamplingStrategy, SamplingStrategy>
}
```

#### UI Component Classes

```typescript
// src/components/analytics/AnalyticsPanel.tsx
export class AnalyticsPanel extends React.Component<AnalyticsPanelProps, AnalyticsPanelState> {
  private analyticsEngine: AnalyticsEngine;
  private costMonitor: CostMonitor;

  constructor(props: AnalyticsPanelProps) {
    super(props);
    this.analyticsEngine = AnalyticsEngine.getInstance();
    this.costMonitor = new CostMonitor();

    this.state = {
      activeTab: 'suggestions',
      selectedSuggestion: null,
      selectedInsight: null,
      promptBuilderOpen: false,
      chatMessages: [],
    };
  }

  componentDidMount(): void {
    this.initializeAnalytics();
  }

  componentDidUpdate(prevProps: AnalyticsPanelProps) {
    if (prevProps.data !== this.props.data) {
      this.updateAnalytics();
    }
  }

  render(): React.ReactNode {
    const { data, filters, onAddChart, onUpdateChart } = this.props;
    const { activeTab, selectedSuggestion, selectedInsight, promptBuilderOpen, chatMessages } = this.state;

    return (
      <div className="analytics-panel h-full flex flex-col bg-white">
        {/* Cost Monitor */}
        <CostMonitor costAnalysis={this.costMonitor.analysis} />

        {/* Tab Navigation */}
        <div className="analytics-tabs flex border-b border-gray-200">
          {this.renderTabs()}
        </div>

        {/* Tab Content */}
        <div className="analytics-content flex-1 overflow-auto">
          {this.renderTabContent()}
        </div>

        {/* Modals */}
        {this.renderModals()}
      </div>
    );
  }

  private renderTabs(): JSX.Element[];
  private renderTabContent(): JSX.Element;
  private renderModals(): JSX.Element;
  private initializeAnalytics(): void;
  private updateAnalytics(): void;
  private handleTabChange(tab: string): void;
  private handleSuggestionExecute(suggestion: AnalyticsSuggestion): void;
  private handleInsightGenerate(type: InsightType): void;
  private handlePromptExecute(prompt: string, variables: Record<string, any>): void;
  private handleChatMessage(message: string): void;

  private analyticsEngine: AnalyticsEngine;
  private costMonitor: CostMonitor;
}

// src/components/analytics/SuggestionPanel.tsx
export class SuggestionPanel extends React.Component<SuggestionPanelProps, SuggestionPanelState> {
  private filterManager: SuggestionFilterManager;
  private sortManager: SuggestionSortManager;

  constructor(props: SuggestionPanelProps) {
    super(props);
    this.filterManager = new SuggestionFilterManager();
    this.sortManager = new SuggestionSortManager();

    this.state = {
      filters: {},
      sortBy: 'priority',
      sortOrder: 'desc',
      filteredSuggestions: [],
    };
  }

  componentDidMount(): void {
    this.updateFilteredSuggestions();
  }

  componentDidUpdate(prevProps: SuggestionPanelProps) {
    if (prevProps.suggestions !== this.props.suggestions) {
      this.updateFilteredSuggestions();
    }
  }

  render(): React.ReactNode {
    const { filteredSuggestions } = this.state;
    const { onSelect, onExecute, onPromptBuilder } = this.props;

    return (
      <div className="suggestion-panel p-4">
        {/* Filter and Sort Controls */}
        <div className="suggestion-controls mb-4">
          {this.renderFilterControls()}
          {this.renderSortControls()}
        </div>

        {/* Suggestions Grid */}
        <div className="suggestions-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onSelect={onSelect}
              onExecute={onExecute}
              onPromptBuilder={onPromptBuilder}
            />
          ))}
        </div>
      </div>
    );
  }

  private renderFilterControls(): JSX.Element;
  private renderSortControls(): JSX.Element;
  private updateFilteredSuggestions(): void;
  private handleFilterChange(filter: string, value: any): void;
  private handleSortChange(sortBy: string, sortOrder: string): void;

  private filterManager: SuggestionFilterManager;
  private sortManager: SuggestionSortManager;
}

// src/components/analytics/ChatPanel.tsx
export class ChatPanel extends React.Component<ChatPanelProps, ChatPanelState> {
  private messageScroller: React.RefObject<HTMLDivElement>;
  private suggestionEngine: ChatSuggestionEngine;

  constructor(props: ChatPanelProps) {
    super(props);
    this.messageScroller = React.createRef();
    this.suggestionEngine = new ChatSuggestionEngine();

    this.state = {
      inputValue: '',
      suggestions: [],
      isTyping: false,
    };
  }

  componentDidMount(): void {
    this.scrollToBottom();
  }

  componentDidUpdate(prevProps: ChatPanelProps) {
    if (prevProps.messages !== this.props.messages) {
      this.scrollToBottom();
    }
  }

  render(): React.ReactNode {
    const { messages, onSendMessage, onSuggestionClick, isLoading } = this.props;
    const { inputValue, suggestions, isTyping } = this.state;

    return (
      <div className="chat-panel flex flex-col h-full">
        {/* Messages Container */}
        <div ref={this.messageScroller} className="chat-messages flex-1 overflow-y-auto p-4">
          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              onSuggestionClick={onSuggestionClick}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Input Area */}
        <div className="chat-input-area p-4 border-t">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => this.handleInputChange(e.target.value)}
              onKeyDown={(e) => this.handleKeyDown(e)}
              placeholder="Ask a question about your data..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
            />

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="chat-suggestions absolute bottom-full mb-2 w-full bg-white border rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => this.handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={() => this.handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  private scrollToBottom(): void;
  private handleInputChange(value: string): void;
  private handleKeyDown(event: React.KeyboardEvent): void;
  private handleSend(): void;
  private handleSuggestionClick(suggestion: string): void;
  private generateSuggestions(): void;

  private messageScroller: React.RefObject<HTMLDivElement>;
  private suggestionEngine: ChatSuggestionEngine;
}
```

### Modified Classes

#### src/hooks/useLLMAnalytics.ts - Main analytics hook

**Current file**: src/hooks/useLLMAnalytics.ts
**Specific modifications**:

- Replace basic OpenRouter integration with advanced client
- Add context management and compression
- Implement prompt engineering strategies
- Add cost optimization and caching

**Enhanced hook**:

```typescript
// src/hooks/useLLMAnalytics.ts
export function useLLMAnalytics(excelData: ExcelData | null, options: LLMAnalyticsOptions = {}) {
  const openRouter = useOpenRouter()
  const contextManager = useContextManager()
  const analyticsEngine = useAnalyticsEngine()
  const costAnalyzer = useCostAnalysis()

  const generateSuggestion = useCallback(
    async (template: string, variables: Record<string, any> = {}) => {
      // Build optimized context
      const context = await contextManager.buildContext(excelData, {
        strategy: options.contextStrategy || 'adaptive',
        maxTokens: options.maxContextTokens || 4000,
        compression: options.enableCompression,
      })

      // Generate optimized prompt
      const prompt = await analyticsEngine.buildPrompt(template, {
        variables,
        context,
        model: options.model || 'gpt-4',
        optimization: true,
      })

      // Execute with cost optimization
      const response = await openRouter.generateCompletion({
        model: options.model || 'gpt-4',
        prompt,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        costOptimization: true,
      })

      // Record cost
      costAnalyzer.recordUsage(response.usage, response.model)

      return response
    },
    [openRouter, contextManager, analyticsEngine, costAnalyzer, excelData, options],
  )

  const generateInsight = useCallback(
    async (analysisType: InsightType, insightOptions: InsightOptions = {}) => {
      const context = await contextManager.buildContext(excelData, {
        strategy: 'full',
        includeStatistics: true,
        includeSchema: true,
        compression: true,
      })

      const insight = await analyticsEngine.generateInsight({
        type: analysisType,
        context,
        model: insightOptions.model || 'gpt-4',
        temperature: insightOptions.temperature || 0.3,
        visualization: insightOptions.includeVisualization,
      })

      costAnalyzer.recordUsage(insight.metadata.tokensUsed, insight.metadata.model)

      return insight
    },
    [contextManager, analyticsEngine, costAnalyzer, excelData],
  )

  return {
    generateSuggestion,
    generateInsight,
    executePrompt: analyticsEngine.executePrompt,
    suggestions: analyticsEngine.suggestions,
    insights: analyticsEngine.insights,
    costAnalysis: costAnalyzer.analysis,
    context: contextManager.context,
  }
}
```

#### src/components/analytics/AnalyticsPanel.tsx - Main panel component

**Current file**: src/components/analytics/AnalyticsPanel.tsx
**Specific modifications**:

- Replace basic UI with advanced tabbed interface
- Add prompt builder and chat functionality
- Implement real-time cost monitoring
- Add suggestion and insight management

**Enhanced component**:

```typescript
// src/components/analytics/AnalyticsPanel.tsx
export class AnalyticsPanel extends React.Component<AnalyticsPanelProps, AnalyticsPanelState> {
  private analyticsEngine: AnalyticsEngine;
  private costMonitor: CostMonitor;

  constructor(props: AnalyticsPanelProps) {
    super(props);
    this.analyticsEngine = AnalyticsEngine.getInstance();
    this.costMonitor = new CostMonitor();

    this.state = {
      activeTab: 'suggestions',
      selectedSuggestion: null,
      selectedInsight: null,
      promptBuilderOpen: false,
      chatMessages: [],
    };
  }

  render(): React.ReactNode {
    const { data, filters, onAddChart, onUpdateChart } = this.props;
    const { activeTab, selectedSuggestion, selectedInsight, promptBuilderOpen, chatMessages } = this.state;

    return (
      <div className="analytics-panel h-full flex flex-col bg-white">
        {/* Cost Monitor */}
        <CostMonitor costAnalysis={this.costMonitor.analysis} />

        {/* Tab Navigation */}
        <div className="analytics-tabs flex border-b border-gray-200">
          {(['suggestions', 'insights', 'prompts', 'chat'] as const).map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => this.setState({ activeTab: tab })}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="analytics-content flex-1 overflow-auto">
          {activeTab === 'suggestions' && (
            <SuggestionPanel
              suggestions={this.analyticsEngine.suggestions}
              onSelect={(suggestion) => this.setState({ selectedSuggestion: suggestion })}
              onExecute={this.handleSuggestionExecute}
              onPromptBuilder={() => this.setState({ promptBuilderOpen: true })}
            />
          )}

          {activeTab === 'insights' && (
            <InsightPanel
              insights={this.analyticsEngine.insights}
              onSelect={(insight) => this.setState({ selectedInsight: insight })}
              onGenerate={this.handleInsightGenerate}
            />
          )}

          {activeTab === 'prompts' && (
            <PromptPanel
              templates={this.analyticsEngine.promptTemplates}
              onExecute={this.handlePromptExecute}
              onBuilder={() => this.setState({ promptBuilderOpen: true })}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPanel
              messages={chatMessages}
              onSendMessage={this.handleChatMessage}
              onSuggestionClick={this.handleSuggestionClick}
              isLoading={this.state.isTyping}
            />
          )}
        </div>

        {/* Modals */}
        {selectedSuggestion && (
          <SuggestionDetailsModal
            suggestion={selectedSuggestion}
            onClose={() => this.setState({ selectedSuggestion: null })}
            onExecute={this.handleSuggestionExecute}
          />
        )}

        {selectedInsight && (
          <InsightDetailsModal
            insight={selectedInsight}
            onClose={() => this.setState({ selectedInsight: null })}
          />
        )}

        {promptBuilderOpen && (
          <PromptBuilderModal
            excelData={data}
            onClose={() => this.setState({ promptBuilderOpen: false })}
            onExecute={this.handlePromptExecute}
          />
        )}
      </div>
    );
  }

  private handleSuggestionExecute = async (suggestion: AnalyticsSuggestion): Promise<void> => {
    try {
      const result = await this.analyticsEngine.generateSuggestion(suggestion.prompt, {
        dataContext: this.props.data,
        filters: this.props.filters,
      });

      // Handle result (e.g., create chart)
      this.props.onAddChart?.(result.chartConfig);
    } catch (error) {
      console.error('Error executing suggestion:', error);
    }
  };

  private handleInsightGenerate = async (type: InsightType): Promise<void> => {
    try {
      await this.analyticsEngine.generateInsight({
        type,
        context: {
          data: this.props.data,
          filters: this.props.filters,
        },
      });
    } catch (error) {
      console.error('Error generating insight:', error);
    }
  };

  private handlePromptExecute = async (prompt: string, variables: Record<string, any>): Promise<void> => {
    try {
      const result = await this.analyticsEngine.executePrompt(prompt, variables);

      // Add to chat if in chat tab
      if (this.state.activeTab === 'chat') {
        this.setState(prev => ({
          chatMessages: [...prev.chatMessages, {
            id: uuid(),
            role: 'user',
            content: prompt,
            timestamp: Date.now(),
          }, {
            id: uuid(),
            role: 'assistant',
            content: result,
            timestamp: Date.now(),
          }],
        }));
      }
    } catch (error) {
      console.error('Error executing prompt:', error);
    }
  };

  private handleChatMessage = async (message: string): Promise<void> => {
    this.setState(prev => ({
      chatMessages: [...prev.chatMessages, {
        id: uuid(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      }],
      isTyping: true,
    }));

    try {
      const response = await this.analyticsEngine.executePrompt(message, {
        chatHistory: this.state.chatMessages,
        currentData: this.props.data,
        filters: this.props.filters,
      });

      this.setState(prev => ({
        chatMessages: [...prev.chatMessages, {
          id: uuid(),
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        }],
        isTyping: false,
      }));
    } catch (error) {
      console.error('Error in chat:', error);
      this.setState({ isTyping: false });
    }
  };

  private handleSuggestionClick = (suggestion: string): void => {
    this.setState({ inputValue: suggestion });
  };

  private analyticsEngine: AnalyticsEngine;
  private costMonitor: CostMonitor;
}
```

### Removed Classes

#### src/hooks/useLLMAnalytics.ts - Basic analytics classes

**Current file**: src/hooks/useLLMAnalytics.ts
**Reason**: Replaced with advanced OpenRouter integration and analytics engine
**Replacement strategy**:

- Use new OpenRouterClient for API calls
- Use new AnalyticsEngine for suggestion and insight generation
- Use new ContextManager for data context management

**Classes to remove**:

- BasicLLMClient → Replace with OpenRouterClient
- SimpleAnalyticsEngine → Replace with AnalyticsEngine
- BasicContextManager → Replace with ContextManager

#### src/components/analytics/AnalyticsPanel.tsx - Basic UI classes

**Current file**: src/components/analytics/AnalyticsPanel.tsx
**Reason**: Replaced with advanced tabbed interface and components
**Replacement strategy**:

- Use new SuggestionPanel for suggestions
- Use new InsightPanel for insights
- Use new PromptPanel and ChatPanel for prompts and chat

**Classes to remove**:

- BasicSuggestionList → Replace with SuggestionPanel
- SimpleInsightView → Replace with InsightPanel
- BasicPromptInterface → Replace with PromptPanel and ChatPanel

## Dependencies

Single sentence describing dependency modifications.

Details of new packages, version changes, and integration requirements.

### New Dependencies to Install

```json
{
  "dependencies": {
    "openai": "^4.20.1",
    "@anthropic-ai/sdk": "^0.8.1",
    "cohere-ai": "^6.0.0",
    "zod": "^3.22.2",
    "json-schema": "^0.4.0",
    "lodash": "^4.17.21",
    "date-fns": "^2.30.0",
    "recharts": "^2.8.0",
    "react-query": "^3.39.3",
    "swr": "^2.2.4",
    "framer-motion": "^10.16.4",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.288.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0"
  },
  "devDependencies": {
    "@types/openai": "^3.2.4",
    "@types/lodash": "^4.14.199",
    "@types/json-schema": "^7.0.12",
    "@types/react-query": "^3.39.3",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "msw": "^1.3.2",
    "fake-indexeddb": "^5.0.1",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### Existing Dependencies to Update

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.2",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "tailwindcss": "^3.3.3",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "xlsx": "^0.18.5",
    "file-saver": "^2.0.5",
    "uuid": "^9.0.1",
    "immer": "^10.0.2",
    "reselect": "^4.1.8",
    "zustand": "^4.4.1",
    "jotai": "^2.5.1",
    "react-window": "^1.8.8",
    "react-virtualized": "^9.22.5",
    "use-context-selector": "^1.4.1",
    "memoize-one": "^6.1.1",
    "fast-equals": "^5.0.1"
  }
}
```

### Integration Requirements

#### OpenRouter Integration

- Integrate OpenAI, Anthropic, and Cohere SDKs for multi-model support
- Implement model selection and optimization based on requirements
- Add streaming response support for real-time interactions
- Implement tool/function calling for advanced data analysis
- Add cost optimization and budget management features

#### Analytics Engine Integration

- Integrate prompt engineering strategies for better LLM responses
- Implement context compression and sampling for efficient data handling
- Add insight generation and validation for reliable analytics
- Implement suggestion matching and ranking for relevant recommendations
- Add performance monitoring and optimization for analytics operations

#### UI Integration

- Integrate recharts for data visualization and insights
- Implement framer-motion for smooth animations and transitions
- Add react-query for efficient data fetching and caching
- Implement react-hot-toast for user notifications
- Add tailwind-merge for efficient className management

#### Testing Integration

- Integrate MSW for API mocking and testing
- Implement fake-indexeddb for localStorage testing
- Add comprehensive testing utilities for OpenRouter integration
- Implement performance testing for analytics operations
- Add user acceptance testing for UI components

## Testing

Single sentence describing testing approach.

Test file requirements, existing test modifications, and validation strategies.

### New Test Files to Create

#### OpenRouter Integration Tests

```
src/__tests__/integrations/openrouter/
├── OpenRouterClient.test.ts
├── OpenRouterModels.test.ts
├── OpenRouterCache.test.ts
├── OpenRouterCost.test.ts
├── OpenRouterTools.test.ts
└── OpenRouterStream.test.ts
```

#### Analytics Engine Tests

```
src/__tests__/analytics/
├── engine/
│   ├── AnalyticsEngine.test.tsx
│   ├── SuggestionEngine.test.tsx
│   ├── InsightEngine.test.tsx
│   └── PromptEngine.test.tsx
├── context/
│   ├── ContextManager.test.ts
│   ├── ContextCompression.test.ts
│   ├── ContextSampling.test.ts
│   └── ContextValidation.test.ts
├── prompts/
│   ├── PromptTemplates.test.ts
│   ├── PromptBuilder.test.tsx
│   ├── PromptOptimizer.test.tsx
│   └── PromptStrategies.test.tsx
├── insights/
│   ├── InsightGenerator.test.tsx
│   ├── InsightValidator.test.tsx
│   ├── InsightVisualizer.test.tsx
│   └── InsightScoring.test.tsx
└── suggestions/
    ├── SuggestionGenerator.test.tsx
    ├── SuggestionMatcher.test.tsx
    ├── SuggestionRanker.test.tsx
    └── SuggestionCache.test.ts
```

#### UI Component Tests

```
src/__tests__/components/analytics/
├── AnalyticsPanel.test.tsx
├── SuggestionPanel.test.tsx
├── InsightPanel.test.tsx
├── PromptPanel.test.tsx
├── ChatPanel.test.tsx
├── SuggestionCard.test.tsx
├── InsightCard.test.tsx
├── PromptCard.test.tsx
├── ChatMessageCard.test.tsx
├── PromptBuilder.test.tsx
├── InsightBuilder.test.tsx
└── SuggestionBuilder.test.tsx
```

#### Hook Tests

```
src/__tests__/hooks/
├── useOpenRouter.test.ts
├── useAnalytics.test.ts
├── useSuggestions.test.ts
├── useInsights.test.ts
├── usePrompts.test.ts
├── useChat.test.ts
├── useContextManager.test.ts
├── usePromptBuilder.test.ts
├── useCostAnalysis.test.ts
└── useCache.test.ts
```

#### Integration Tests

```
src/__tests__/integration/
├── openrouter/
│   ├── ModelSelection.test.tsx
│   ├── CostOptimization.test.tsx
│   ├── StreamingResponses.test.tsx
│   └── ToolCalling.test.tsx
├── analytics/
│   ├── EndToEndAnalytics.test.tsx
│   ├── ContextManagement.test.tsx
│   ├── PromptEngineering.test.tsx
│   ├── InsightGeneration.test.tsx
│   └── SuggestionGeneration.test.tsx
├── ui/
│   ├── AnalyticsWorkflow.test.tsx
│   ├── ChatInteraction.test.tsx
│   ├── PromptBuilding.test.tsx
│   └── CostMonitoring.test.tsx
└── performance/
    ├── LargeDatasetAnalytics.test.tsx
    ├── RealTimeSuggestions.test.tsx
    ├── CostEfficientAnalytics.test.tsx
    └── UserExperienceAnalytics.test.tsx
```

### Existing Test Modifications

#### Update Hook Tests

- **src/**tests**/hooks/useLLMAnalytics.test.ts**: Update to test advanced OpenRouter integration
- **src/**tests**/hooks/useExcelData.test.ts**: Update to test analytics metadata generation
- **src/**tests**/hooks/useFilters.test.ts**: Update to test analytics integration
- **src/**tests**/hooks/useCharts.test.ts**: Update to test analytics-driven chart generation

#### Update Component Tests

- **src/**tests**/components/analytics/AnalyticsPanel.test.ts**: Update to test advanced tabbed interface
- **src/**tests**/components/DataTable.test.ts**: Update to test analytics integration
- **src/**tests**/components/FilterPanel.test.ts**: Update to test analytics suggestions
- **src/**tests**/components/charts/ChartView.test.ts**: Update to test analytics-driven insights

### Test Strategies

#### OpenRouter Integration Testing Strategy

- **API Client Testing**: Test OpenRouter client functionality with various models
- **Model Selection Testing**: Test optimal model selection for different requirements
- **Cost Optimization Testing**: Test cost calculation and optimization strategies
- **Streaming Testing**: Test streaming response handling and real-time updates
- **Tool Calling Testing**: Test tool/function calling for data analysis

#### Analytics Engine Testing Strategy

- **Prompt Engineering Testing**: Test prompt optimization and engineering strategies
- **Context Management Testing**: Test context compression, sampling, and validation
- **Insight Generation Testing**: Test insight generation, validation, and visualization
- **Suggestion Testing**: Test suggestion generation, matching, and ranking
- **Performance Testing**: Test analytics engine performance with large datasets

#### UI Component Testing Strategy

- **Panel Integration Testing**: Test tabbed interface and component integration
- **User Interaction Testing**: Test user interactions with suggestions, insights, and chat
- **Real-time Updates Testing**: Test real-time updates and state management
- **Responsive Design Testing**: Test responsive design across different screen sizes
- **Accessibility Testing**: Test accessibility compliance and keyboard navigation

#### Integration Testing Strategy

- **End-to-End Analytics Testing**: Test complete analytics workflow from data to insights
- **Context Management Testing**: Test context management with various data sizes
- **Cost Monitoring Testing**: Test cost monitoring and budget alerting
- **User Experience Testing**: Test user experience with real-world scenarios
- **Performance Testing**: Test performance with large datasets and multiple users

### Validation Criteria

#### OpenRouter Integration Validation

- [ ] All OpenRouter models are accessible and functional
- [ ] Model selection optimization works correctly
- [ ] Cost calculation is accurate and optimization is effective
- [ ] Streaming responses work smoothly with real-time updates
- [ ] Tool calling enables advanced data analysis capabilities

#### Analytics Engine Validation

- [ ] Prompt engineering strategies improve response quality
- [ ] Context management efficiently handles large datasets
- [ ] Insight generation produces accurate and valuable insights
- [ ] Suggestion matching provides relevant and actionable recommendations
- [ ] Performance optimization ensures smooth operation with large data

#### UI Component Validation

- [ ] Tabbed interface provides intuitive navigation
- [ ] Real-time updates work without performance issues
- [ ] User interactions are smooth and responsive
- [ ] Responsive design works across all screen sizes
- [ ] Accessibility features enable inclusive usage

#### Integration Validation

- [ ] End-to-end analytics workflow works seamlessly
- [ ] Context management handles various data scenarios
- [ ] Cost monitoring provides accurate and timely alerts
- [ ] User experience is smooth and intuitive
- [ ] Performance meets requirements for large datasets

#### Overall Validation

- [ ] OpenRouter integration provides robust LLM capabilities
- [ ] Analytics engine delivers valuable insights and suggestions
- [ ] UI components provide excellent user experience
- [ ] Integration between all components works seamlessly
- [ ] Performance and cost optimization are effective

## Implementation Order

Single sentence describing the implementation sequence.

Numbered steps showing the logical order of changes to minimize conflicts and ensure successful integration.

### 1. Setup Foundation (Day 1-2)

1. **Install new dependencies**: Add openai, @anthropic-ai/sdk, cohere-ai, zod, json-schema, lodash, date-fns, recharts,
   react-query, swr
2. **Create folder structure**: Set up integrations, analytics, components, hooks, and utils folders
3. **Update TypeScript configuration**: Add path aliases and strict mode settings
4. **Create base types**: Define OpenRouterTypes, AnalyticsTypes, and UI component types

### 2. Implement OpenRouter Integration (Day 2-4)

1. **Create OpenRouterClient**: Implement main API client with retry logic
2. **Create OpenRouterModels**: Implement model management and selection
3. **Create OpenRouterCache**: Implement response caching and optimization
4. **Create OpenRouterCost**: Implement cost calculation and optimization
5. **Create OpenRouterTools**: Implement tool/function calling
6. **Create OpenRouterStream**: Implement streaming response handling
7. **Test OpenRouter integration**: Write unit and integration tests

### 3. Implement Analytics Engine (Day 4-6)

1. **Create AnalyticsEngine**: Implement main analytics engine
2. **Create SuggestionEngine**: Implement suggestion generation and ranking
3. **Create InsightEngine**: Implement insight generation and validation
4. **Create PromptEngine**: Implement prompt building and optimization
5. **Create ContextManager**: Implement data context management
6. **Test analytics engine**: Write unit and integration tests

### 4. Implement Context Management (Day 6-8)

1. **Create ContextCompression**: Implement context compression strategies
2. **Create ContextSampling**: Implement context sampling strategies
3. **Create ContextValidation**: Implement context validation
4. **Implement context optimization**: Add performance optimizations
5. **Test context management**: Write unit and integration tests

### 5. Implement UI Components (Day 8-10)

1. **Create AnalyticsPanel**: Implement main analytics panel with tabs
2. **Create SuggestionPanel**: Implement suggestions display and management
3. **Create InsightPanel**: Implement insights display and interaction
4. **Create PromptPanel**: Implement prompt templates and execution
5. **Create ChatPanel**: Implement chat interface with suggestions
6. **Create card components**: Implement suggestion, insight, and message cards
7. **Create builder components**: Implement prompt and insight builders
8. **Test UI components**: Write unit and integration tests

### 6. Implement Hooks (Day 10-12)

1. **Create useOpenRouter**: Implement OpenRouter integration hook
2. **Create useAnalytics**: Implement analytics engine hook
3. **Create useSuggestions**: Implement suggestions management hook
4. **Create useInsights**: Implement insights management hook
5. **Create usePrompts**: Implement prompts management hook
6. **Create useChat**: Implement chat interface hook
7. **Create useContextManager**: Implement context management hook
8. **Create usePromptBuilder**: Implement prompt builder hook
9. **Create useCostAnalysis**: Implement cost analysis hook
10. **Create useCache**: Implement cache management hook
11. **Test hooks**: Write unit and integration tests

### 7. Implement Utility Functions (Day 12-14)

1. **Create prompt engineering utilities**: Implement various prompt strategies
2. **Create insight generation utilities**: Implement insight generation algorithms
3. **Create suggestion matching utilities**: Implement suggestion matching and ranking
4. **Create cost optimization utilities**: Implement cost optimization strategies
5. **Create validation utilities**: Implement various validation functions
6. **Test utilities**: Write unit tests for all utility functions

### 8. Update Existing Components (Day 14-16)

1. **Update useLLMAnalytics**: Replace with advanced OpenRouter integration
2. **Update AnalyticsPanel**: Replace with advanced tabbed interface
3. **Update ExcelParser**: Add analytics metadata generation
4. **Update DataTable**: Add analytics integration
5. **Update FilterPanel**: Add analytics suggestions
6. **Update ChartView**: Add analytics-driven insights
7. **Test component updates**: Write integration tests for all updated components

### 9. Implement Advanced Features (Day 16-18)

1. **Create advanced prompt engineering**: Implement sophisticated prompt strategies
2. **Create real-time suggestions**: Implement real-time suggestion generation
3. **Create interactive insights**: Implement interactive insight exploration
4. **Create collaborative analytics**: Implement sharing and collaboration features
5. **Create performance monitoring**: Implement comprehensive performance monitoring
6. **Test advanced features**: Write unit and integration tests

### 10. Testing and Validation (Day 18-20)

1. **Comprehensive testing**: Run all unit, integration, and performance tests
2. **OpenRouter validation**: Validate OpenRouter integration with all models
3. **Analytics validation**: Validate analytics engine with various datasets
4. **UI validation**: Validate UI components with user testing
5. **Performance validation**: Validate performance with large datasets
6. **Cost validation**: Validate cost optimization and budget management
7. **User acceptance testing**: Validate user experience with real scenarios

### 11. Documentation and Deployment (Day 20-22)

1. **Create documentation**: Document all new features and APIs
2. **Create user guides**: Create user guides for analytics features
3. **Create developer documentation**: Create developer documentation
4. **Prepare deployment**: Prepare for deployment with monitoring
5. **Deploy and monitor**: Deploy changes and monitor performance
6. **Gather feedback**: Gather user feedback and plan improvements

This implementation plan provides a comprehensive approach to implementing OpenRouter integration and LLM analytics,
ensuring powerful AI-driven data analysis capabilities with excellent user experience.
