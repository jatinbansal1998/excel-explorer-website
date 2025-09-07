'use client'

import React, { useState, useMemo } from 'react'
import { ChartType, AggregationType, NumericRange } from '@/types/chart'
import { ColumnInfo, ExcelData } from '@/types/excel'
import { Button } from '../ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { NumericRangeEditor } from './NumericRangeEditor'

interface ChartCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateChart: (config: {
    type: ChartType
    dataColumn: string
    labelColumn?: string
    aggregation: AggregationType
    title: string
    maxSegments?: number
    numericRanges?: NumericRange[]
  }) => void
  columnInfo: ColumnInfo[]
  filteredData: ExcelData['rows']
}

interface ChartTypeConfig {
  type: ChartType
  label: string
  description: string
  variables: 1 | 2
  supportedDataTypes: string[]
  aggregationRequired: boolean
}

const chartTypeConfigs: ChartTypeConfig[] = [
  {
    type: 'pie',
    label: 'Pie Chart',
    description: 'Show distribution of categorical data or numeric ranges',
    variables: 1,
    supportedDataTypes: ['string', 'boolean', 'number'],
    aggregationRequired: true,
  },
]

const aggregationTypes: { type: AggregationType; label: string }[] = [
  { type: 'count', label: 'Count' },
  { type: 'sum', label: 'Sum' },
  { type: 'average', label: 'Average' },
  { type: 'min', label: 'Minimum' },
  { type: 'max', label: 'Maximum' },
  { type: 'median', label: 'Median' },
  { type: 'distinct', label: 'Distinct Count' },
]

// Define which aggregations make sense for each chart type
const chartAggregationRules: Record<ChartType, AggregationType[]> = {
  pie: ['count', 'sum', 'average'],
}

export function ChartCreationModal({
  isOpen,
  onClose,
  onCreateChart,
  columnInfo,
  filteredData,
}: ChartCreationModalProps) {
  const [selectedType, setSelectedType] = useState<ChartType>('pie')
  const [dataColumn, setDataColumn] = useState<string>('')
  const [labelColumn, setLabelColumn] = useState<string>('')
  const [aggregation, setAggregation] = useState<AggregationType>('count')
  const [title, setTitle] = useState<string>('')
  const [maxSegments, setMaxSegments] = useState<number>(10)
  const [dataColumnSearch, setDataColumnSearch] = useState<string>('')
  const [numericRanges, setNumericRanges] = useState<NumericRange[]>([])

  const selectedConfig = chartTypeConfigs.find((c) => c.type === selectedType)

  // Get available aggregations for the selected chart type
  const availableAggregations = selectedConfig
    ? aggregationTypes.filter((agg) => chartAggregationRules[selectedType].includes(agg.type))
    : aggregationTypes

  // Check if selected column is numeric and should show range editor
  const selectedColumnInfo = columnInfo.find((col) => col.name === dataColumn)
  const shouldShowRangeEditor =
    selectedColumnInfo?.type === 'number' && aggregation === 'count' && selectedType === 'pie'

  // Get sample values for the selected numeric column
  const sampleValues = useMemo(() => {
    if (!shouldShowRangeEditor || !dataColumn) return []

    const columnIndex = columnInfo.findIndex((col) => col.name === dataColumn)
    if (columnIndex === -1) return []

    return filteredData
      .map((row) => row[columnIndex])
      .filter((val) => typeof val === 'number' && Number.isFinite(val))
  }, [shouldShowRangeEditor, dataColumn, columnInfo, filteredData])

  // Filter available chart types based on available columns
  const availableChartTypes = chartTypeConfigs.filter((config) => {
    const compatibleColumns = columnInfo.filter((col) =>
      config.supportedDataTypes.includes(col.type),
    )

    if (config.variables === 1) {
      return compatibleColumns.length >= 1
    } else {
      return compatibleColumns.length >= 2
    }
  })

  // Get compatible columns for the selected chart type with intelligent search filtering
  const getCompatibleColumns = (forLabel = false, searchTerm = '') => {
    if (!selectedConfig) return []

    const compatibleColumns = columnInfo.filter((col) => {
      return selectedConfig.supportedDataTypes.includes(col.type)
    })

    if (!searchTerm) {
      // Sort by relevance when no search: numeric columns first for pie charts, then alphabetically
      return compatibleColumns.sort((a, b) => {
        if (selectedConfig.type === 'pie') {
          if (a.type === 'number' && b.type !== 'number') return -1
          if (a.type !== 'number' && b.type === 'number') return 1
        }
        return a.name.localeCompare(b.name)
      })
    }

    const lowerSearch = searchTerm.toLowerCase()

    return compatibleColumns
      .map((col) => {
        const colName = col.name.toLowerCase().trim()
        const searchTerm = lowerSearch.trim()
        let score = 0

        // Exact match gets highest score (case-insensitive)
        if (colName === searchTerm) score += 100
        // Exact match ignoring spaces/underscores
        else if (colName.replace(/[_\s-]/g, '') === searchTerm.replace(/[_\s-]/g, '')) score += 95
        // Starts with search term
        else if (colName.startsWith(searchTerm)) score += 50
        // Starts with after removing separators
        else if (colName.replace(/[_\s-]/g, '').startsWith(searchTerm.replace(/[_\s-]/g, '')))
          score += 45
        // Contains search term
        else if (colName.includes(searchTerm)) score += 25
        // Contains after removing separators
        else if (colName.replace(/[_\s-]/g, '').includes(searchTerm.replace(/[_\s-]/g, '')))
          score += 20
        // Word boundary matches
        else if (
          new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(col.name)
        )
          score += 15
        // Fuzzy matching for common patterns
        else if (fuzzyMatch(colName, searchTerm)) score += 10

        // Boost score for numeric columns in pie charts
        if (selectedConfig.type === 'pie' && col.type === 'number') score += 5

        return { column: col, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.column.name.localeCompare(b.column.name))
      .map((item) => item.column)
  }

  // Simple fuzzy matching for common financial/data terms
  const fuzzyMatch = (columnName: string, searchTerm: string): boolean => {
    const synonyms: { [key: string]: string[] } = {
      price: ['cost', 'value', 'amount', 'rate'],
      amount: ['price', 'cost', 'value', 'sum'],
      date: ['time', 'day', 'month', 'year'],
      name: ['title', 'label', 'description'],
      count: ['number', 'quantity', 'total'],
      percent: ['rate', 'ratio', '%'],
    }

    for (const [key, values] of Object.entries(synonyms)) {
      if (searchTerm.includes(key) && values.some((v) => columnName.includes(v))) {
        return true
      }
      if (columnName.includes(key) && values.some((v) => searchTerm.includes(v))) {
        return true
      }
    }

    return false
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataColumn) return

    const finalTitle =
      title || `${selectedConfig?.label} - ${dataColumn}${labelColumn ? ` by ${labelColumn}` : ''}`

    onCreateChart({
      type: selectedType,
      dataColumn,
      labelColumn: selectedConfig?.variables === 2 ? labelColumn : undefined,
      aggregation,
      title: finalTitle,
      maxSegments,
      numericRanges: shouldShowRangeEditor ? numericRanges : undefined,
    })

    // Reset form
    setDataColumn('')
    setLabelColumn('')
    setTitle('')
    setMaxSegments(10)
    setDataColumnSearch('')
    setNumericRanges([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Chart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Chart Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chart Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableChartTypes.map((config) => (
                <button
                  key={config.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(config.type)
                    setDataColumn('')
                    setLabelColumn('')
                    // Set default aggregation based on chart type
                    const defaultAgg = chartAggregationRules[config.type][0] || 'count'
                    setAggregation(defaultAgg)
                  }}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedType === config.type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {config.variables} variable{config.variables > 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Data Column Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Column {selectedConfig?.variables === 1 ? '' : '(Y-axis)'}
            </label>
            <div className="relative">
              {/* Search input with icon */}
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Type to search columns..."
                  value={dataColumnSearch}
                  onChange={(e) => setDataColumnSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                {dataColumnSearch && (
                  <button
                    type="button"
                    onClick={() => setDataColumnSearch('')}
                    className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Improved dropdown */}
              <div className="space-y-1">
                {getCompatibleColumns(false, dataColumnSearch).length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm border border-gray-300 rounded-lg bg-gray-50">
                    {dataColumnSearch
                      ? `No columns found matching "${dataColumnSearch}"`
                      : 'No compatible columns available'}
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg">
                    {!dataColumn && (
                      <div className="px-3 py-2 text-gray-500 text-sm bg-gray-50 border-b border-gray-200">
                        Select a column below:
                      </div>
                    )}
                    {getCompatibleColumns(false, dataColumnSearch)
                      .filter(
                        (col, index, self) =>
                          // Remove duplicates based on column name
                          self.findIndex((c) => c.name === col.name) === index,
                      )
                      .map((col) => (
                        <button
                          key={`${col.name}-${col.index}`}
                          type="button"
                          onClick={() => {
                            setDataColumn(col.name)
                            setDataColumnSearch('')
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                            dataColumn === col.name
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{col.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({col.type})</span>
                          </div>
                          {col.uniqueCount && (
                            <div className="text-xs text-gray-400 mt-1">
                              {col.uniqueCount} unique values
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Show selected column */}
              {dataColumn && (
                <div className="mt-2 p-2 bg-primary-50 border border-primary-200 rounded text-sm text-primary-700">
                  Selected: <strong>{dataColumn}</strong>
                  <button
                    type="button"
                    onClick={() => setDataColumn('')}
                    className="ml-2 text-primary-500 hover:text-primary-700"
                  >
                    (change)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Label Column Selection (for 2-variable charts) */}
          {selectedConfig?.variables === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Column (X-axis)
              </label>
              <select
                value={labelColumn}
                onChange={(e) => setLabelColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select column...</option>
                {getCompatibleColumns(true)
                  .filter((col) => col.name !== dataColumn)
                  .map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Aggregation Selection */}
          {selectedConfig?.aggregationRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aggregation</label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as AggregationType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                {availableAggregations.map((agg) => (
                  <option key={agg.type} value={agg.type}>
                    {agg.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Max Segments (for pie charts) */}
          {selectedConfig?.type === 'pie' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Segments
              </label>
              <div className="space-y-1">
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={maxSegments}
                  onChange={(e) => setMaxSegments(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500">
                  If your data has more than {maxSegments} categories, the rest will be grouped as
                  &ldquo;Others&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Numeric Range Editor (for numeric pie charts) */}
          {shouldShowRangeEditor && sampleValues.length > 0 && (
            <div>
              <NumericRangeEditor
                ranges={numericRanges}
                onRangesChange={setNumericRanges}
                columnName={dataColumn}
                sampleValues={sampleValues}
                className="border border-gray-200 rounded-lg p-4"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${selectedConfig?.label} - ${dataColumn || 'Column'}${labelColumn ? ` by ${labelColumn}` : ''}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!dataColumn || (selectedConfig?.variables === 2 && !labelColumn)}
            >
              Create Chart
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
