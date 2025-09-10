import {ColumnInfo} from '@/types/excel'
import {AggregationType, ChartSuggestion, ChartType} from '@/types/chart'

export class ChartSuggestionEngine {
    suggestCharts(columns: ColumnInfo[], _filteredData: (string | number | boolean | Date)[][]): ChartSuggestion[] {
    const suggestions: ChartSuggestion[] = []

    const categoricalColumns = columns.filter((c) => c.type === 'string' || c.type === 'boolean')
    const numericColumns = columns.filter((c) => c.type === 'number')
        const _dateColumns = columns.filter((c) => c.type === 'date')

    // Focus on pie charts only for categorical data and numeric ranges
    suggestions.push(...this.suggestCategoricalCharts(categoricalColumns))
    suggestions.push(...this.suggestNumericRangeCharts(numericColumns))

    // Filter to only pie charts since that's what we support
    const pieCharts = suggestions.filter((s) => s.type === 'pie')

    return pieCharts.sort((a, b) => b.confidence - a.confidence)
  }

  private suggestCategoricalCharts(columns: ColumnInfo[]): ChartSuggestion[] {
    return columns.map((column) => ({
      type: 'pie',
      title: `Distribution of ${column.name}`,
      dataColumn: column.name,
      aggregation: 'count',
      confidence: this.calculateConfidence(column, 'pie'),
      reason: 'Categorical data is suitable for pie/doughnut charts',
    }))
  }

  private suggestNumericRangeCharts(columns: ColumnInfo[]): ChartSuggestion[] {
    return columns
      .filter((column) => this.isGoodForPieChart(column))
      .map((column) => ({
        type: 'pie' as ChartType,
        title: `Distribution of ${column.name} Ranges`,
        dataColumn: column.name,
        aggregation: 'count' as AggregationType,
        confidence: this.calculateConfidence(column, 'pie') * 0.9,
        reason: 'Numeric data grouped into ranges for pie chart visualization',
      }))
  }

  private isGoodForPieChart(column: ColumnInfo): boolean {
    // Check if numeric column is suitable for pie chart
    // Good for pie: limited unique values, or can be grouped into ranges
    const uniqueCount = column.uniqueCount || 0

    // If too many unique values, it's better to group into ranges
    if (uniqueCount > 50) return true // Will be grouped into ranges

    // If reasonable number of categories, good for pie
    if (uniqueCount >= 2 && uniqueCount <= 10) return true

    // If very few unique values but has meaningful range, can work
    if (uniqueCount < 2) return false

    return true
  }

  private calculateConfidence(column: ColumnInfo, chart: ChartType): number {
    const base = 0.6
    let confidence = base

    const uniqueCount = column.uniqueCount || 0
    const hasNullPenalty = column.hasNulls ? -0.05 : 0

    if (chart === 'pie') {
      // For pie charts, moderate number of categories is better
      if (column.type === 'string' || column.type === 'boolean') {
        // Categorical data - ideal for pie charts
        if (uniqueCount >= 2 && uniqueCount <= 8) {
          confidence += 0.3 // Perfect for pie
        } else if (uniqueCount <= 15) {
          confidence += 0.2 // Good for pie
        } else if (uniqueCount <= 30) {
          confidence += 0.1 // Okay for pie
        } else {
          confidence -= 0.1 // Too many categories
        }
      } else if (column.type === 'number') {
        // Numeric data - can be grouped into ranges
        if (uniqueCount > 20) {
          confidence += 0.15 // Good for range grouping
        } else if (uniqueCount >= 3 && uniqueCount <= 10) {
          confidence += 0.25 // Great discrete values
        } else {
          confidence -= 0.05 // Less suitable
        }
      }

      // Boost confidence for common financial column patterns
      const columnName = column.name.toLowerCase()
      if (
        columnName.includes('sector') ||
        columnName.includes('industry') ||
        columnName.includes('category') ||
        columnName.includes('type') ||
        columnName.includes('status') ||
        columnName.includes('grade') ||
        columnName.includes('rating') ||
        columnName.includes('class')
      ) {
        confidence += 0.1
      }
    }

    return Math.max(0, Math.min(1, confidence + hasNullPenalty))
  }
}

export const chartSuggestionEngine = new ChartSuggestionEngine()
