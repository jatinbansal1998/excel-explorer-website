'use client'

import { useState, useEffect, useRef } from 'react'
import { ChartSuggestion, ChartType } from '@/types/chart'
import { ColumnInfo, ExcelData } from '@/types/excel'
import { Button } from '../ui/Button'
import { TrashIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline'
import { ChartCreationModal } from './ChartCreationModal'

interface ChartControlsProps {
  suggestions: ChartSuggestion[]
  onAddChart: (s: ChartSuggestion) => void
  onClearCharts?: () => void
  onCreateManualChart?: (config: {
    type: ChartType
    dataColumn: string
    labelColumn?: string
    aggregation: any
    title: string
    maxSegments?: number
    numericRanges?: any[]
  }) => void
  columnInfo: ColumnInfo[]
  filteredData: ExcelData['rows']
}

export function ChartControls({
  suggestions,
  onAddChart,
  onClearCharts,
  onCreateManualChart,
  columnInfo,
  filteredData,
}: ChartControlsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showChartCreationModal, setShowChartCreationModal] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Quick Add Button */}
      <Button
        variant="primary"
        size="sm"
        type="button"
        onClick={() => suggestions[0] && onAddChart(suggestions[0])}
        disabled={suggestions.length === 0}
        title={suggestions.length > 0 ? `Add: ${suggestions[0].title}` : 'No suggestions available'}
      >
        {suggestions.length > 0
          ? `Add: ${suggestions[0].type.charAt(0).toUpperCase() + suggestions[0].type.slice(1)} Chart`
          : 'Add Suggested Chart'}
      </Button>

      {/* All Suggestions Dropdown */}
      {suggestions.length > 1 && (
        <div className="relative" ref={suggestionsRef}>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            All Suggestions ({suggestions.length})
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          </Button>
          {showSuggestions && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg border border-gray-200 shadow-lg z-10 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onAddChart(suggestion)
                    setShowSuggestions(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm text-gray-900">{suggestion.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} •{' '}
                    {suggestion.reason} • {Math.round(suggestion.confidence * 100)}% confidence
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Chart Creation */}
      {onCreateManualChart && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowChartCreationModal(true)}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Create Chart
        </Button>
      )}

      {/* Clear All Button */}
      {onClearCharts && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onClearCharts}
          aria-label="Remove all charts"
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <TrashIcon className="w-4 h-4 mr-2" />
          Remove all
        </Button>
      )}

      {/* Chart Creation Modal */}
      <ChartCreationModal
        isOpen={showChartCreationModal}
        onClose={() => setShowChartCreationModal(false)}
        onCreateChart={onCreateManualChart || (() => {})}
        columnInfo={columnInfo}
        filteredData={filteredData}
      />
    </div>
  )
}

export default ChartControls
