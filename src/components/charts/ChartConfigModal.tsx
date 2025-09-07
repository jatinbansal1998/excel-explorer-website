'use client'

import React, { useMemo, useState } from 'react'
import { ChartConfig, ChartType } from '@/types/chart'
import { ColumnInfo } from '@/types/excel'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface ChartConfigModalProps {
  isOpen: boolean
  onClose: () => void
  config: ChartConfig
  columnInfo: ColumnInfo[]
  onSave: (config: ChartConfig) => void
}

export function ChartConfigModal({
  isOpen,
  onClose,
  config,
  columnInfo,
  onSave,
}: ChartConfigModalProps) {
  const [formData, setFormData] = useState<ChartConfig>(config)

  const dataColumns = useMemo(() => columnInfo.map((c) => c.name), [columnInfo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chart Configuration">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Chart Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Chart Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ChartType })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="histogram">Histogram</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Data Column</label>
          <select
            value={formData.dataColumn}
            onChange={(e) => setFormData({ ...formData, dataColumn: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            {dataColumns.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Chart</Button>
        </div>
      </form>
    </Modal>
  )
}

export default ChartConfigModal
