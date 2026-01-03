'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultCollapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
  headerActions?: React.ReactNode
  badge?: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  testId?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
  onCollapseChange,
  headerActions,
  badge,
  className = '',
  headerClassName = '',
  contentClassName = '',
  testId,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [children])

  useEffect(() => {
    if (!collapsed && contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight)
        }
      })
      resizeObserver.observe(contentRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [collapsed])

  const toggleCollapse = useCallback(() => {
    const newState = !collapsed
    setCollapsed(newState)
    onCollapseChange?.(newState)
  }, [collapsed, onCollapseChange])

  return (
    <div
      className={`section-container overflow-hidden flex flex-col ${className}`}
      data-testid={testId}
    >
      {/* Header - always visible */}
      <div
        className={`px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200 ${headerClassName}`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleCollapse}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-md p-1 -ml-1 hover:bg-gray-100 transition-colors"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                collapsed ? '-rotate-90' : 'rotate-0'
              }`}
            />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </button>
          {badge && <div className="flex items-center">{badge}</div>}
        </div>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>

      {/* Content - collapsible */}
      <div
        className="transition-all duration-200 ease-in-out overflow-hidden"
        style={{
          maxHeight: collapsed ? 0 : contentHeight,
          opacity: collapsed ? 0 : 1,
        }}
      >
        <div ref={contentRef} className={`p-4 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
