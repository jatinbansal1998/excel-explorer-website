import { AggregationType, ChartType } from '@/types/chart'

export interface ChartTypeConfig {
  type: ChartType
  label: string
  description: string
  variables: 1 | 2
  supportedDataTypes: string[]
  aggregationRequired: boolean
}

export const chartTypeConfigs: ChartTypeConfig[] = [
  {
    type: 'pie',
    label: 'Pie Chart',
    description: 'Show distribution of categorical data or numeric ranges',
    variables: 1,
    supportedDataTypes: ['string', 'boolean', 'number'],
    aggregationRequired: true,
  },
  {
    type: 'bar',
    label: 'Bar Chart',
    description: 'Compare values across categories',
    variables: 1,
    supportedDataTypes: ['string', 'boolean', 'number'],
    aggregationRequired: true,
  },
  {
    type: 'line',
    label: 'Line Chart',
    description: 'Show trends over time or continuous data',
    variables: 1,
    supportedDataTypes: ['number', 'date'],
    aggregationRequired: true,
  },
  {
    type: 'doughnut',
    label: 'Doughnut Chart',
    description: 'Show distribution with a center space',
    variables: 1,
    supportedDataTypes: ['string', 'boolean', 'number'],
    aggregationRequired: true,
  },
  {
    type: 'scatter',
    label: 'Scatter Plot',
    description: 'Show relationships between two variables',
    variables: 2,
    supportedDataTypes: ['number'],
    aggregationRequired: false,
  },
]

export const aggregationTypes: { type: AggregationType; label: string }[] = [
  { type: 'count', label: 'Count' },
  { type: 'sum', label: 'Sum' },
  { type: 'average', label: 'Average' },
  { type: 'min', label: 'Minimum' },
  { type: 'max', label: 'Maximum' },
  { type: 'median', label: 'Median' },
  { type: 'distinct', label: 'Distinct Count' },
]

// Define which aggregations make sense for each chart type
export const chartAggregationRules: Record<ChartType, AggregationType[]> = {
  pie: ['count', 'sum', 'average'],
  bar: ['count', 'sum', 'average', 'min', 'max'],
  line: ['count', 'sum', 'average', 'min', 'max'],
  doughnut: ['count', 'sum', 'average'],
  scatter: ['count', 'sum', 'average', 'min', 'max'],
}

