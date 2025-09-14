'use client'

import { useState } from 'react'
import { NumericRange } from '@/types/chart'
import { numericRangeGenerator } from '@/services/numericRangeGenerator'
import { Button } from '../ui/Button'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { v4 as uuidv4 } from 'uuid'

interface NumericRangeEditorProps {
  ranges: NumericRange[]
  onRangesChange: (ranges: NumericRange[]) => void
  columnName: string
  sampleValues: number[]
  className?: string
}

export function NumericRangeEditor({
  ranges,
  onRangesChange,
  columnName,
  sampleValues,
  className,
}: NumericRangeEditorProps) {
  const [error, setError] = useState<string>('')

  const generateDefaultRanges = () => {
    const defaultRanges = numericRangeGenerator.generateDefaultRanges(sampleValues, columnName)
    onRangesChange(defaultRanges)
    setError('')
  }

  const addRange = () => {
    const newRange: NumericRange = {
      id: uuidv4(),
      label: 'New Range',
      min: 0,
      max: 100,
      includeMin: true,
      includeMax: false,
    }
    onRangesChange([...ranges, newRange])
    setError('')
  }

  const updateRange = (index: number, updates: Partial<NumericRange>) => {
    const updatedRanges = ranges.map((range, i) => (i === index ? { ...range, ...updates } : range))
    onRangesChange(updatedRanges)

    // Validate after update
    const validationError = numericRangeGenerator.validateRanges(updatedRanges)
    setError(validationError || '')
  }

  const removeRange = (index: number) => {
    const updatedRanges = ranges.filter((_, i) => i !== index)
    onRangesChange(updatedRanges)

    const validationError = numericRangeGenerator.validateRanges(updatedRanges)
    setError(validationError || '')
  }

  const minValue = Math.min(...sampleValues.filter((v) => Number.isFinite(v)))
  const maxValue = Math.max(...sampleValues.filter((v) => Number.isFinite(v)))

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Numeric Ranges</h4>
            <p className="text-xs text-gray-500">
              Data range: {minValue.toFixed(2)} to {maxValue.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={generateDefaultRanges}>
              Auto-Generate
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addRange}>
              <PlusIcon className="w-4 h-4" />
              Add Range
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
          {ranges.map((range, index) => (
            <div
              key={range.id}
              className="grid grid-cols-12 gap-2 items-center p-3 border border-gray-200 rounded"
            >
              {/* Label */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={range.label}
                  onChange={(e) => updateRange(index, { label: e.target.value })}
                  placeholder="Range label"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Min value */}
              <div className="col-span-2">
                <input
                  type="number"
                  value={range.min}
                  onChange={(e) => updateRange(index, { min: parseFloat(e.target.value) || 0 })}
                  placeholder="Min"
                  step="any"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Include min checkbox */}
              <div className="col-span-1 flex justify-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={range.includeMin}
                    onChange={(e) => updateRange(index, { includeMin: e.target.checked })}
                    className="w-3 h-3 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-1 text-xs text-gray-500">≥</span>
                </label>
              </div>

              {/* Max value */}
              <div className="col-span-2">
                <input
                  type="number"
                  value={range.max}
                  onChange={(e) => updateRange(index, { max: parseFloat(e.target.value) || 0 })}
                  placeholder="Max"
                  step="any"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Include max checkbox */}
              <div className="col-span-1 flex justify-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={range.includeMax}
                    onChange={(e) => updateRange(index, { includeMax: e.target.checked })}
                    className="w-3 h-3 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-1 text-xs text-gray-500">≤</span>
                </label>
              </div>

              {/* Preview */}
              <div className="col-span-2">
                <div className="text-xs text-gray-600 truncate" title={formatRangePreview(range)}>
                  {formatRangePreview(range)}
                </div>
              </div>

              {/* Remove button */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRange(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={ranges.length <= 1}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {ranges.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No ranges defined. Click &ldquo;Auto-Generate&rdquo; to create smart defaults or
            &ldquo;Add Range&rdquo; to create custom ranges.
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>
            <strong>Tip:</strong> Use checkboxes to control whether boundary values are included
            (≥/≤) or excluded (&gt;/&lt;).
          </p>
        </div>
      </div>
    </div>
  )

  function formatRangePreview(range: NumericRange): string {
    const minSymbol = range.includeMin ? '≥' : '>'
    const maxSymbol = range.includeMax ? '≤' : '<'

    if (range.min === range.max) {
      return range.includeMin && range.includeMax ? `= ${range.min}` : 'Invalid'
    }

    return `${minSymbol}${range.min} & ${maxSymbol}${range.max}`
  }
}
