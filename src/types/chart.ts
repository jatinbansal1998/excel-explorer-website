export type ChartType = 'pie' | 'bar' | 'line' | 'doughnut' | 'scatter'

export interface NumericRange {
  id: string
  label: string
  min: number
  max: number
  includeMin: boolean
  includeMax: boolean
}

export type AggregationType = 'count' | 'sum' | 'average' | 'min' | 'max' | 'median' | 'distinct'

export interface ChartOptions {
  responsive: boolean
  maintainAspectRatio: boolean
  plugins: {
    legend: {
      display: boolean
      position: 'top' | 'bottom' | 'left' | 'right'
    }
    title: {
      display: boolean
      text: string
    }
    tooltip: {
      enabled: boolean
      callbacks?: unknown
    }
  }
  scales?: unknown
  animation?: {
    duration: number
    easing: string
  }
}

export interface ChartDataDataset {
  label: string
  data: number[]
  backgroundColor: string | string[]
  borderColor: string | string[]
  borderWidth: number
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataDataset[]
}

export type ChartPosition = {
  row: number
  column: number
  width: number
  height: number
}

export interface ChartConfig {
  id: string
  title: string
  type: ChartType
  dataColumn: string
  labelColumn?: string
  aggregation: AggregationType
  options: ChartOptions
  position: ChartPosition
  maxSegments?: number // For pie charts - max number of segments before grouping others
  numericRanges?: NumericRange[] // For numerical pie charts - custom range definitions
}

export interface ChartSuggestion {
  type: ChartType
  title: string
  dataColumn: string
  labelColumn?: string
  aggregation: AggregationType
  confidence: number // 0-1
  reason: string
}
