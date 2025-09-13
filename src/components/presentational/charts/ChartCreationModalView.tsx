'use client'

import React from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { NumericRangeEditor } from '@/components/charts/NumericRangeEditor'
import { AggregationType, ChartType, NumericRange } from '@/types/chart'
import { ColumnInfo } from '@/types/excel'
import { ChartTypeConfig } from '@/utils/chartConfig'

interface ChartCreationModalViewProps {
  isOpen: boolean
  onClose: () => void

  selectedType: ChartType
  onChangeType: (t: ChartType) => void
  availableChartTypes: ChartTypeConfig[]

  dataColumn: string
  onChangeDataColumn: (name: string) => void
  dataColumnSearch: string
  onChangeDataColumnSearch: (s: string) => void
  compatibleDataColumns: (search: string) => ColumnInfo[]

  labelColumn?: string
  onChangeLabelColumn?: (name: string) => void

  aggregation: AggregationType
  onChangeAggregation: (a: AggregationType) => void
  availableAggregations: { type: AggregationType; label: string }[]

  maxSegments: number
  onChangeMaxSegments: (n: number) => void

  shouldShowRangeEditor: boolean
  numericRanges: NumericRange[]
  onChangeNumericRanges: (ranges: NumericRange[]) => void
  sampleValues: number[]

  title: string
  onChangeTitle: (t: string) => void
  defaultTitle: string

  canSubmit: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function ChartCreationModalView(props: ChartCreationModalViewProps) {
  const {
    isOpen,
    onClose,

    selectedType,
    onChangeType,
    availableChartTypes,

    dataColumn,
    onChangeDataColumn,
    dataColumnSearch,
    onChangeDataColumnSearch,
    compatibleDataColumns,

    labelColumn,
    onChangeLabelColumn,

    aggregation,
    onChangeAggregation,
    availableAggregations,

    maxSegments,
    onChangeMaxSegments,

    shouldShowRangeEditor,
    numericRanges,
    onChangeNumericRanges,
    sampleValues,

    title,
    onChangeTitle,
    defaultTitle,

    canSubmit,
    onSubmit,
  } = props

  if (!isOpen) return null

  const selectedConfig = availableChartTypes.find((c) => c.type === selectedType)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Chart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Chart Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chart Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableChartTypes.map((config) => (
                <button
                  key={config.type}
                  type="button"
                  onClick={() => onChangeType(config.type)}
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
                  onChange={(e) => onChangeDataColumnSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {dataColumnSearch && (
                  <button
                    type="button"
                    onClick={() => onChangeDataColumnSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Improved dropdown */}
              <div className="space-y-1">
                {compatibleDataColumns(dataColumnSearch).length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm border border-gray-300 rounded-lg bg-gray-50">
                    {dataColumnSearch ? `No columns found matching "${dataColumnSearch}"` : 'No compatible columns available'}
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg">
                    {!dataColumn && (
                      <div className="px-3 py-2 text-gray-500 text-sm bg-gray-50 border-b border-gray-200">
                        Select a column below:
                      </div>
                    )}
                    {compatibleDataColumns(dataColumnSearch)
                      .filter((col, index, self) => self.findIndex((c) => c.name === col.name) === index)
                      .map((col) => (
                        <button
                          key={`${col.name}-${col.index}`}
                          type="button"
                          onClick={() => {
                            onChangeDataColumn(col.name)
                            onChangeDataColumnSearch('')
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                            dataColumn === col.name ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{col.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({col.type})</span>
                          </div>
                          {col.uniqueCount && (
                            <div className="text-xs text-gray-400 mt-1">{col.uniqueCount} unique values</div>
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
                  <button type="button" onClick={() => onChangeDataColumn('')} className="ml-2 text-primary-500 hover:text-primary-700">
                    (change)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Label Column Selection (for 2-variable charts) */}
          {selectedConfig?.variables === 2 && onChangeLabelColumn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Label Column (X-axis)</label>
              <select
                value={labelColumn || ''}
                onChange={(e) => onChangeLabelColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select column...</option>
                {compatibleDataColumns('')
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
                onChange={(e) => onChangeAggregation(e.target.value as AggregationType)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Segments</label>
              <div className="space-y-1">
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={maxSegments}
                  onChange={(e) => onChangeMaxSegments(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500">
                  If your data has more than {maxSegments} categories, the rest will be grouped as &ldquo;Others&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Numeric Range Editor (for numeric pie charts) */}
          {shouldShowRangeEditor && sampleValues.length > 0 && (
            <div>
              <NumericRangeEditor
                ranges={numericRanges}
                onRangesChange={onChangeNumericRanges}
                columnName={dataColumn}
                sampleValues={sampleValues}
                className="border border-gray-200 rounded-lg p-4"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder={defaultTitle}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              Create Chart
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChartCreationModalView
