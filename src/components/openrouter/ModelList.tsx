import React, { useMemo } from 'react'
import { OpenRouterModel } from '../../types/openrouter'

interface Props {
  models: OpenRouterModel[]
  selectedModelId?: string
  onSelect: (modelId: string) => void
}

function formatCompact(value?: number): string {
  if (typeof value !== 'number' || !isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) {
    const n = value / 1_000_000_000
    return Number.isInteger(n) ? `${n}b` : `${n.toFixed(1)}b`
  }
  if (abs >= 1_000_000) {
    const n = value / 1_000_000
    return Number.isInteger(n) ? `${n}m` : `${n.toFixed(1)}m`
  }
  if (abs >= 1_000) {
    const n = value / 1_000
    return Number.isInteger(n) ? `${n}k` : `${n.toFixed(1)}k`
  }
  return String(value)
}

function formatPrice(value?: string): string {
  if (!value) return '—'
  return `$${value}`
}

export function ModelList({ models, selectedModelId, onSelect }: Props) {
  const rows = useMemo(() => models, [models])

  return (
    <div className="border border-gray-200 rounded-md overflow-auto max-h-80">
      <div className="min-w-[1280px]">
        <div className="grid grid-cols-[320px_160px_140px_140px_160px_140px_420px] px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 sticky top-0 z-10 uppercase tracking-wider border-b border-gray-200">
          <div>Name</div>
          <div>Provider</div>
          <div>Context Length</div>
          <div>Prompt</div>
          <div>Completion</div>
          <div>Request</div>
          <div>ID</div>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {rows.map((m) => {
            const provider = m.id.includes('/') ? m.id.split('/')[0] : '—'
            const selected = selectedModelId === m.id
            const p = m.pricing
            return (
              <li
                key={m.id}
                className={`grid grid-cols-[320px_160px_140px_140px_160px_140px_420px] items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selected ? 'bg-primary-50' : ''}`}
                onClick={() => onSelect(m.id)}
              >
                <div className="truncate" title={m.name || m.description || m.id}>
                  {m.name || m.description || '—'}
                </div>
                <div className="truncate" title={provider}>
                  {provider}
                </div>
                <div
                  className="truncate"
                  title={typeof m.context_length === 'number' ? String(m.context_length) : '—'}
                >
                  {formatCompact(m.context_length as number | undefined)}
                </div>
                <div className="truncate" title={p?.prompt ? `$${p.prompt}` : '—'}>
                  {formatPrice(p?.prompt)}
                </div>
                <div className="truncate" title={p?.completion ? `$${p.completion}` : '—'}>
                  {formatPrice(p?.completion)}
                </div>
                <div className="truncate" title={p?.request ? `$${p.request}` : '—'}>
                  {formatPrice(p?.request)}
                </div>
                <div className="truncate" title={m.id}>
                  {m.id}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
