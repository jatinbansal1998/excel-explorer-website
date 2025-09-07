import { NumericRange } from '@/types/chart'
import { v4 as uuidv4 } from 'uuid'

export class NumericRangeGenerator {
  generateDefaultRanges(values: number[], columnName: string): NumericRange[] {
    if (!values.length) return []

    const sortedValues = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
    if (sortedValues.length === 0) return []

    const min = sortedValues[0]
    const max = sortedValues[sortedValues.length - 1]

    // If all values are the same, create a single range
    if (min === max) {
      return [
        {
          id: uuidv4(),
          label: `${min}`,
          min: min,
          max: max,
          includeMin: true,
          includeMax: true,
        },
      ]
    }

    // Use different strategies based on data characteristics
    if (this.isFinancialData(columnName, min, max)) {
      return this.generateFinancialRanges(min, max)
    } else if (this.isPercentageData(columnName, min, max)) {
      return this.generatePercentageRanges(min, max)
    } else if (this.isAgeData(columnName, min, max)) {
      return this.generateAgeRanges(min, max)
    } else if (max - min < 100 && Number.isInteger(min) && Number.isInteger(max)) {
      return this.generateIntegerRanges(min, max)
    } else {
      return this.generateQuantileRanges(sortedValues)
    }
  }

  private isFinancialData(columnName: string, min: number, max: number): boolean {
    const lowerName = columnName.toLowerCase()
    const isFinancialName =
      lowerName.includes('price') ||
      lowerName.includes('cost') ||
      lowerName.includes('revenue') ||
      lowerName.includes('profit') ||
      lowerName.includes('income') ||
      lowerName.includes('salary') ||
      lowerName.includes('amount') ||
      lowerName.includes('value') ||
      lowerName.includes('$') ||
      lowerName.includes('usd')
    return isFinancialName && max > 1000
  }

  private isPercentageData(columnName: string, min: number, max: number): boolean {
    const lowerName = columnName.toLowerCase()
    const isPercentageName =
      lowerName.includes('percent') ||
      lowerName.includes('%') ||
      lowerName.includes('rate') ||
      lowerName.includes('ratio')
    return (isPercentageName || (min >= 0 && max <= 100)) && max <= 100
  }

  private isAgeData(columnName: string, min: number, max: number): boolean {
    const lowerName = columnName.toLowerCase()
    const isAgeName = lowerName.includes('age') || lowerName.includes('year')
    return isAgeName && min >= 0 && max <= 120
  }

  private generateFinancialRanges(min: number, max: number): NumericRange[] {
    const ranges: NumericRange[] = []

    if (min < 0) {
      ranges.push({
        id: uuidv4(),
        label: 'Negative',
        min: min,
        max: 0,
        includeMin: true,
        includeMax: false,
      })
    }

    const startVal = Math.max(0, min)
    const brackets = this.getFinancialBrackets(startVal, max)

    for (let i = 0; i < brackets.length; i++) {
      const isLast = i === brackets.length - 1
      ranges.push({
        id: uuidv4(),
        label: isLast
          ? `${this.formatCurrency(brackets[i])}+`
          : `${this.formatCurrency(brackets[i])} - ${this.formatCurrency(brackets[i + 1])}`,
        min: brackets[i],
        max: isLast ? max : brackets[i + 1],
        includeMin: true,
        includeMax: !isLast,
      })
    }

    return ranges
  }

  private generatePercentageRanges(min: number, max: number): NumericRange[] {
    const ranges = [
      { min: 0, max: 10, label: '0-10%' },
      { min: 10, max: 25, label: '10-25%' },
      { min: 25, max: 50, label: '25-50%' },
      { min: 50, max: 75, label: '50-75%' },
      { min: 75, max: 90, label: '75-90%' },
      { min: 90, max: 100, label: '90-100%' },
    ]

    return ranges
      .filter((r) => r.max >= min && r.min <= max)
      .map((r) => ({
        id: uuidv4(),
        label: r.label,
        min: Math.max(r.min, min),
        max: Math.min(r.max, max),
        includeMin: true,
        includeMax: r.max === 100,
      }))
  }

  private generateAgeRanges(min: number, max: number): NumericRange[] {
    const ranges = [
      { min: 0, max: 18, label: 'Under 18' },
      { min: 18, max: 25, label: '18-25' },
      { min: 25, max: 35, label: '25-35' },
      { min: 35, max: 45, label: '35-45' },
      { min: 45, max: 55, label: '45-55' },
      { min: 55, max: 65, label: '55-65' },
      { min: 65, max: 120, label: '65+' },
    ]

    return ranges
      .filter((r) => r.max >= min && r.min <= max)
      .map((r) => ({
        id: uuidv4(),
        label: r.label,
        min: Math.max(r.min, min),
        max: Math.min(r.max, max),
        includeMin: true,
        includeMax: r.max === 120,
      }))
  }

  private generateIntegerRanges(min: number, max: number): NumericRange[] {
    const range = max - min
    const ranges: NumericRange[] = []

    if (range <= 10) {
      // Small range: create individual values or small groups
      for (let i = min; i <= max; i += Math.max(1, Math.floor(range / 5))) {
        const rangeMax = Math.min(i + Math.max(1, Math.floor(range / 5)) - 1, max)
        ranges.push({
          id: uuidv4(),
          label: i === rangeMax ? `${i}` : `${i}-${rangeMax}`,
          min: i,
          max: rangeMax,
          includeMin: true,
          includeMax: true,
        })
      }
    } else {
      // Larger range: create meaningful brackets
      const stepSize = Math.ceil(range / 6)
      for (let i = min; i <= max; i += stepSize) {
        const rangeMax = Math.min(i + stepSize - 1, max)
        const isLast = rangeMax === max
        ranges.push({
          id: uuidv4(),
          label: isLast ? `${i}+` : `${i}-${rangeMax}`,
          min: i,
          max: rangeMax,
          includeMin: true,
          includeMax: true,
        })
      }
    }

    return ranges
  }

  private generateQuantileRanges(sortedValues: number[]): NumericRange[] {
    const ranges: NumericRange[] = []
    const quartiles = [0, 0.25, 0.5, 0.75, 1.0]

    for (let i = 0; i < quartiles.length - 1; i++) {
      const startIdx = Math.floor(quartiles[i] * (sortedValues.length - 1))
      const endIdx = Math.floor(quartiles[i + 1] * (sortedValues.length - 1))
      const min = sortedValues[startIdx]
      const max = sortedValues[endIdx]

      if (min !== max) {
        const isLast = i === quartiles.length - 2
        ranges.push({
          id: uuidv4(),
          label: this.getQuartileLabel(i, min, max, isLast),
          min,
          max,
          includeMin: true,
          includeMax: isLast,
        })
      }
    }

    return ranges
  }

  private getFinancialBrackets(min: number, max: number): number[] {
    const brackets: number[] = []

    // Start from the minimum or a sensible base
    let current = min
    brackets.push(current)

    if (max <= 1000) {
      // Small amounts: 100, 250, 500, etc.
      const steps = [100, 250, 500, 750, 1000]
      for (const step of steps) {
        if (step > current && step < max) {
          brackets.push(step)
          current = step
        }
      }
    } else if (max <= 10000) {
      // Medium amounts: 1K, 2.5K, 5K, etc.
      const steps = [1000, 2500, 5000, 7500, 10000]
      for (const step of steps) {
        if (step > current && step < max) {
          brackets.push(step)
          current = step
        }
      }
    } else if (max <= 100000) {
      // Large amounts: 10K, 25K, 50K, etc.
      const steps = [10000, 25000, 50000, 75000, 100000]
      for (const step of steps) {
        if (step > current && step < max) {
          brackets.push(step)
          current = step
        }
      }
    } else {
      // Very large amounts: 100K, 250K, 500K, 1M, etc.
      const steps = [100000, 250000, 500000, 1000000, 2500000, 5000000]
      for (const step of steps) {
        if (step > current && step < max) {
          brackets.push(step)
          current = step
        }
      }
    }

    return brackets
  }

  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
    } else {
      return `$${value.toFixed(0)}`
    }
  }

  private getQuartileLabel(index: number, min: number, max: number, isLast: boolean): string {
    const labels = ['Bottom 25%', 'Lower Middle', 'Upper Middle', 'Top 25%']
    return `${labels[index]}: ${min.toFixed(1)}-${max.toFixed(1)}${isLast ? '+' : ''}`
  }

  validateRange(range: NumericRange): string | null {
    if (
      range.min >= range.max &&
      !(range.min === range.max && range.includeMin && range.includeMax)
    ) {
      return 'Minimum value must be less than maximum value'
    }
    if (!range.label.trim()) {
      return 'Range label cannot be empty'
    }
    return null
  }

  validateRanges(ranges: NumericRange[]): string | null {
    if (ranges.length === 0) {
      return 'At least one range is required'
    }

    // Check for overlapping ranges
    const sortedRanges = [...ranges].sort((a, b) => a.min - b.min)
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i]
      const next = sortedRanges[i + 1]

      if (
        current.max > next.min ||
        (current.max === next.min && current.includeMax && next.includeMin)
      ) {
        return `Range "${current.label}" overlaps with "${next.label}"`
      }
    }

    return null
  }
}

export const numericRangeGenerator = new NumericRangeGenerator()
