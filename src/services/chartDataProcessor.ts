import { ChartConfig, ChartData, AggregationType, NumericRange } from '@/types/chart'
import { ColumnInfo } from '@/types/excel'

export class ChartDataProcessor {
  prepareChartData(data: any[][], config: ChartConfig, columnInfo: ColumnInfo[]): ChartData {
    const dataColumnIndex = this.findColumnIndex(config.dataColumn, columnInfo)
    const labelColumnIndex = config.labelColumn
      ? this.findColumnIndex(config.labelColumn, columnInfo)
      : null

    if (config.type === 'pie') {
      return this.preparePieData(data, dataColumnIndex, labelColumnIndex, config)
    }

    throw new Error(`Chart type "${config.type}" is not supported. Only pie charts are available.`)
  }

  private findColumnIndex(columnName: string, columns: ColumnInfo[]): number {
    const found = columns.find((c) => c.name === columnName)
    if (!found) throw new Error(`Column not found: ${columnName}`)
    return found.index
  }

  private preparePieData(
    data: any[][],
    dataColumn: number,
    labelColumn: number | null,
    config: ChartConfig,
  ): ChartData {
    const aggregated = this.aggregateData(data, dataColumn, labelColumn, config.aggregation, config)

    if (aggregated.length === 0) {
      throw new Error(
        'No valid data found for pie chart. Please ensure your selected column contains data.',
      )
    }

    // Limit pie chart segments based on user preference
    let finalData = aggregated
    const maxSegments = config.maxSegments || 10 // Default to 10 if not specified

    if (aggregated.length > maxSegments) {
      // Keep top (maxSegments-1) segments and group the rest as "Others"
      const sorted = aggregated.sort((a, b) => b.value - a.value)
      const topSegments = sorted.slice(0, maxSegments - 1)
      const others = sorted.slice(maxSegments - 1)
      const othersTotal = others.reduce((sum, item) => sum + item.value, 0)

      if (othersTotal > 0) {
        finalData = [...topSegments, { label: 'Others', value: othersTotal }]
      } else {
        finalData = topSegments
      }
    }

    // Remove zero or negative values for pie charts
    const validData = finalData.filter((item) => item.value > 0)

    if (validData.length === 0) {
      throw new Error(
        'No positive values found for pie chart. Pie charts require positive numeric values.',
      )
    }

    return {
      labels: validData.map((item) => item.label),
      datasets: [
        {
          label: config.title,
          data: validData.map((item) => item.value),
          backgroundColor: this.generateColors(validData.length),
          borderColor: this.generateBorderColors(validData.length),
          borderWidth: 2,
        },
      ],
    }
  }

  private aggregateData(
    data: any[][],
    dataColumn: number,
    labelColumn: number | null,
    aggregation: AggregationType,
    config: ChartConfig,
  ): { label: string; value: number }[] {
    const groups = new Map<string, any[]>()

    // Filter out empty rows
    const validData = data.filter(
      (row) => row && row.length > Math.max(dataColumn, labelColumn || 0),
    )

    if (validData.length === 0) {
      return []
    }

    for (const row of validData) {
      let label: string
      let value: any

      if (labelColumn !== null) {
        // Two-column scenario: label column for labels, data column for values
        const labelValue = row[labelColumn]
        const dataValue = row[dataColumn]

        // Skip rows with null/undefined values
        if (labelValue == null || dataValue == null) continue

        label = String(labelValue).trim()
        value = dataValue
      } else {
        // Single-column scenario: data column contains the categories to count
        const dataValue = row[dataColumn]

        // Skip null/undefined values
        if (dataValue == null) continue

        // For numeric columns, use custom ranges if provided, otherwise create default ranges
        if (typeof dataValue === 'number' && aggregation === 'count') {
          const customRanges = config.numericRanges

          if (customRanges && customRanges.length > 0) {
            label = this.assignToCustomRange(dataValue, customRanges)
          } else {
            label = this.createNumericRange(dataValue)
          }
          value = 1
        } else {
          label = String(dataValue).trim()
          value = 1 // We'll count occurrences
        }
      }

      // Skip empty labels
      if (label === '' || label === 'null' || label === 'undefined') {
        label = 'Unknown'
      }

      if (!groups.has(label)) groups.set(label, [])
      groups.get(label)!.push(value)
    }

    const result = Array.from(groups.entries()).map(([label, values]) => ({
      label,
      value: this.applyAggregation(values, aggregation),
    }))

    // Sort by value descending for better pie chart presentation
    return result.sort((a, b) => b.value - a.value)
  }

  private assignToCustomRange(value: number, ranges: NumericRange[]): string {
    for (const range of ranges) {
      const minOk = range.includeMin ? value >= range.min : value > range.min
      const maxOk = range.includeMax ? value <= range.max : value < range.max

      if (minOk && maxOk) {
        return range.label
      }
    }
    return 'Out of range'
  }

  private createNumericRange(value: number): string {
    // Create meaningful ranges for financial data
    if (value < 0) return 'Negative'
    if (value === 0) return 'Zero'
    if (value < 1) return '0-1'
    if (value < 10) return '1-10'
    if (value < 100) return '10-100'
    if (value < 1000) return '100-1K'
    if (value < 10000) return '1K-10K'
    if (value < 100000) return '10K-100K'
    if (value < 1000000) return '100K-1M'
    return '1M+'
  }

  private applyAggregation(values: any[], type: AggregationType): number {
    switch (type) {
      case 'count':
        return values.length
      case 'sum':
        return values.reduce((sum, v) => sum + (Number(v) || 0), 0)
      case 'average': {
        const valid = values.map((v) => Number(v)).filter((v) => Number.isFinite(v))
        return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : 0
      }
      case 'min': {
        const valid = values.map((v) => Number(v)).filter((v) => Number.isFinite(v))
        return valid.length ? Math.min(...valid) : 0
      }
      case 'max': {
        const valid = values.map((v) => Number(v)).filter((v) => Number.isFinite(v))
        return valid.length ? Math.max(...valid) : 0
      }
      case 'median': {
        const sorted = values
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v))
          .sort((a, b) => a - b)
        if (!sorted.length) return 0
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
      }
      case 'distinct':
        return new Set(values).size
      default:
        return 0
    }
  }

  generateColors(count: number): string[] {
    const base = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#22c55e',
      '#14b8a6',
      '#f97316',
      '#eab308',
      '#06b6d4',
    ]
    const colors: string[] = []
    for (let i = 0; i < count; i++) {
      colors.push(base[i % base.length])
    }
    return colors
  }

  generateBorderColors(count: number): string[] {
    return this.generateColors(count).map((c) => c)
  }
}

export const chartDataProcessor = new ChartDataProcessor()
