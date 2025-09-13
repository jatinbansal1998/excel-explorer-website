'use client'

import React from 'react'
import { AggregationType, ChartType, NumericRange } from '@/types/chart'
import { ColumnInfo, ExcelData } from '@/types/excel'
import { useChartCreationModal } from '@/hooks/useChartCreationModal'
import { ChartCreationModalView } from '@/components/presentational/charts/ChartCreationModalView'

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

export function ChartCreationModal({
  isOpen,
  onClose,
  onCreateChart,
  columnInfo,
  filteredData,
}: ChartCreationModalProps) {
  const vm = useChartCreationModal({ columnInfo, filteredData })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vm.dataColumn) return
    const payload = vm.buildPayload()
    onCreateChart(payload)
    vm.resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <ChartCreationModalView
      isOpen={isOpen}
      onClose={onClose}
      selectedType={vm.selectedType}
      onChangeType={vm.onChangeType}
      availableChartTypes={vm.availableChartTypes}
      dataColumn={vm.dataColumn}
      onChangeDataColumn={vm.setDataColumn}
      dataColumnSearch={vm.dataColumnSearch}
      onChangeDataColumnSearch={vm.setDataColumnSearch}
      compatibleDataColumns={vm.compatibleDataColumns}
      labelColumn={vm.labelColumn}
      onChangeLabelColumn={vm.setLabelColumn}
      aggregation={vm.aggregation}
      onChangeAggregation={vm.setAggregation}
      availableAggregations={vm.availableAggregations}
      maxSegments={vm.maxSegments}
      onChangeMaxSegments={vm.setMaxSegments}
      shouldShowRangeEditor={vm.shouldShowRangeEditor}
      numericRanges={vm.numericRanges}
      onChangeNumericRanges={vm.setNumericRanges}
      sampleValues={vm.sampleValues}
      title={vm.title}
      onChangeTitle={vm.setTitle}
      defaultTitle={vm.defaultTitle}
      canSubmit={vm.canSubmit}
      onSubmit={handleSubmit}
    />
  )
}
