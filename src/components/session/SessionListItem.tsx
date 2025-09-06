'use client'

import React from 'react'
import type { PersistedSession } from '../../utils/storage/service'

interface SessionListItemProps {
  session: PersistedSession
  isActive: boolean
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

export function SessionListItem({ session, isActive, onSelect, onDelete }: SessionListItemProps) {
  const summary = session.summary
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer border ${
        isActive ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
      }`}
      onClick={() => onSelect(session.id)}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(session.id)
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {summary.fileName || 'Untitled Session'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {summary.totalRows || 0} rows × {summary.totalColumns || 0} cols • Updated{' '}
          {new Date(session.updatedAt).toLocaleString()}
        </p>
      </div>
      <button
        className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(session.id)
        }}
        aria-label={`Delete session ${summary.fileName || session.id}`}
      >
        Delete
      </button>
    </div>
  )
}
