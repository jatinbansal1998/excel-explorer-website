'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { FilterConfig } from '@/types/filter'

interface Props {
  collapsed: boolean
  onToggleCollapsed: () => void
  filterListQuery: string
  onChangeQuery: (_v: string) => void
  filters: Readonly<FilterConfig[]>
  onResetAll: () => void
  renderFilterItem: (_filter: FilterConfig) => React.ReactNode
}

export default function FilterPanelView(props: Readonly<Props>) {
  const { collapsed, onToggleCollapsed, filterListQuery, onChangeQuery, filters, onResetAll, renderFilterItem } =
    props

  return (
    <div
      className="section-container overflow-hidden flex flex-col"
      style={collapsed ? undefined : { height: 'calc(100vh - 200px)', minHeight: '500px' }}
    >
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <h3 className="font-semibold">Filters</h3>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleCollapsed}
                className="whitespace-nowrap"
                aria-label={collapsed ? 'Expand filters' : 'Collapse filters'}
                title={collapsed ? 'Expand filters' : 'Collapse filters'}
              >
                {collapsed ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />}
              </Button>
              {!collapsed && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onResetAll}
                  className="whitespace-nowrap"
                  aria-label="Reset all filters"
                  title="Reset all filters"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {!collapsed && (
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="Search filters..."
              value={filterListQuery}
              onChange={(e) => onChangeQuery(e.target.value)}
            />
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="overflow-auto flex-1 px-3 py-2">
          <div className="grid grid-cols-1 gap-2">
            {filters.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500">No filters available. Upload data to create filters.</p>
              </div>
            ) : (
              filters.map((f) => (
                <div key={f.id} className="border border-gray-200 rounded-md p-2 bg-gray-50">
                  {renderFilterItem(f)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

