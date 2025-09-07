'use client'

import React, { useMemo, useState } from 'react'
import type { PersistedSession } from '@/utils/storage/service'
import { SessionListItem } from './SessionListItem'

interface SessionManagerModalProps {
  isOpen: boolean
  onClose: () => void
  sessions: PersistedSession[]
  onRestore: (sessionId: string) => void
  onDelete: (sessionId: string) => void
  onClearAll?: () => void
}

export function SessionManagerModal({
  isOpen,
  onClose,
  sessions,
  onRestore,
  onDelete,
  onClearAll,
}: SessionManagerModalProps) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'file' | 'rows' | 'cols'>('updated')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = sessions
    if (q) {
      list = list.filter((s) => {
        const sum = s.summary
        const hay = [sum.fileName, sum.sheetName, ...(sum.columns || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }
    const arr = [...list]
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'file':
          return (a.summary.fileName || '').localeCompare(b.summary.fileName || '')
        case 'rows':
          return (b.summary.totalRows || 0) - (a.summary.totalRows || 0)
        case 'cols':
          return (b.summary.totalColumns || 0) - (a.summary.totalColumns || 0)
        case 'updated':
        default:
          return a.updatedAt < b.updatedAt ? 1 : -1
      }
    })
    return arr
  }, [sessions, query, sortBy])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 section-container"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Manage Sessions</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file, sheet, or column"
              className="flex-1 border rounded px-3 py-2"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded px-2 py-2"
            >
              <option value="updated">Last Updated</option>
              <option value="file">File Name</option>
              <option value="rows">Rows</option>
              <option value="cols">Columns</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 max-h-80 overflow-auto border rounded p-2">
              {filtered.length === 0 && <p className="text-sm text-gray-500">No sessions found.</p>}
              {filtered.map((s) => (
                <SessionListItem
                  key={s.id}
                  session={s}
                  isActive={selected === s.id}
                  onSelect={(id) => setSelected(id)}
                  onDelete={onDelete}
                />
              ))}
            </div>
            <div className="border rounded p-3 min-h-[12rem]">
              {selected ? (
                (() => {
                  const s = sessions.find((x) => x.id === selected)
                  if (!s)
                    return <p className="text-sm text-gray-500">Select a session to preview.</p>
                  return (
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">File:</span>{' '}
                        {s.summary.fileName || 'Untitled'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Sheet:</span> {s.summary.sheetName}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Rows:</span> {s.summary.totalRows} •{' '}
                        <span className="font-medium">Cols:</span> {s.summary.totalColumns}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Updated:</span>{' '}
                        {new Date(s.updatedAt).toLocaleString()}
                      </p>
                      {s.summary.columns && s.summary.columns.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <p className="font-medium">Columns:</p>
                          <p className="break-words">{s.summary.columns.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )
                })()
              ) : (
                <p className="text-sm text-gray-500">Select a session to preview.</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-xs text-gray-500">{sessions.length} total</div>
          <div className="space-x-2">
            {onClearAll && (
              <button
                className="px-3 py-2 text-sm border rounded text-red-600"
                onClick={onClearAll}
              >
                Clear all
              </button>
            )}
            <button className="px-3 py-2 text-sm border rounded" onClick={onClose}>
              Cancel
            </button>
            <button
              className="px-3 py-2 text-sm bg-primary-600 text-white rounded disabled:opacity-60"
              disabled={!selected}
              onClick={() => selected && onRestore(selected)}
            >
              Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
