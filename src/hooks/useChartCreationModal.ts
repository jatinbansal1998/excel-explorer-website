import { useCallback, useMemo, useState } from 'react'
import { AggregationType, ChartType, NumericRange } from '@/types/chart'
import { ColumnInfo, ExcelData } from '@/types/excel'
import {
  aggregationTypes,
  chartAggregationRules,
  chartTypeConfigs,
  ChartTypeConfig,
} from '@/utils/chartConfig'
import { getCompatibleColumns, rankColumns } from '@/utils/columnSearch'

export interface UseChartCreationModalParams {
  columnInfo: ColumnInfo[]
  filteredData: ExcelData['rows']
}

export function useChartCreationModal({ columnInfo, filteredData }: UseChartCreationModalParams) {
  const [selectedType, setSelectedType] = useState<ChartType>('pie')
  const [dataColumn, setDataColumn] = useState<string>('')
  const [labelColumn, setLabelColumn] = useState<string>('')
  const [aggregation, setAggregation] = useState<AggregationType>('count')
  const [title, setTitle] = useState<string>('')
  const [maxSegments, setMaxSegments] = useState<number>(10)
  const [dataColumnSearch, setDataColumnSearch] = useState<string>('')
  const [numericRanges, setNumericRanges] = useState<NumericRange[]>([])

  const selectedConfig: ChartTypeConfig | undefined = useMemo(
    () => chartTypeConfigs.find((c) => c.type === selectedType),
    [selectedType],
  )

  const availableAggregations = useMemo(() => {
    return selectedConfig
      ? aggregationTypes.filter((agg) => chartAggregationRules[selectedType].includes(agg.type))
      : aggregationTypes
  }, [selectedConfig, selectedType])

  const selectedColumnInfo = useMemo(
    () => columnInfo.find((col) => col.name === dataColumn),
    [columnInfo, dataColumn],
  )

  const shouldShowRangeEditor = useMemo(() => {
    return selectedColumnInfo?.type === 'number' && aggregation === 'count' && selectedType === 'pie'
  }, [selectedColumnInfo?.type, aggregation, selectedType])

  const sampleValues: number[] = useMemo(() => {
    if (!shouldShowRangeEditor || !dataColumn) return []
    const columnIndex = columnInfo.findIndex((col) => col.name === dataColumn)
    if (columnIndex === -1) return []
    return (
      filteredData
        .map((row) => row[columnIndex])
        .filter((val) => typeof val === 'number' && Number.isFinite(val)) as number[]
    )
  }, [shouldShowRangeEditor, dataColumn, columnInfo, filteredData])

  const availableChartTypes = useMemo(() => {
    return chartTypeConfigs.filter((config) => {
      const compatible = columnInfo.filter((col) => config.supportedDataTypes.includes(col.type))
      if (config.variables === 1) return compatible.length >= 1
      return compatible.length >= 2
    })
  }, [columnInfo])

  const compatibleDataColumns = useCallback(
    (searchTerm: string) => {
      const compatible = getCompatibleColumns(columnInfo, selectedType)
      return rankColumns(compatible, searchTerm, selectedType)
    },
    [columnInfo, selectedType],
  )

  const canSubmit = useMemo(() => {
    if (!dataColumn) return false
    if (selectedConfig?.variables === 2 && !labelColumn) return false
    return true
  }, [dataColumn, labelColumn, selectedConfig?.variables])

  const defaultTitle = useMemo(() => {
    return `${selectedConfig?.label} - ${dataColumn || 'Column'}${labelColumn ? ` by ${labelColumn}` : ''}`
  }, [selectedConfig?.label, dataColumn, labelColumn])

  const onChangeType = useCallback(
    (type: ChartType) => {
      setSelectedType(type)
      // Reset selections like in original component
      setDataColumn('')
      setLabelColumn('')
      const defaultAgg = chartAggregationRules[type][0] || 'count'
      setAggregation(defaultAgg)
    },
    [],
  )

  const resetForm = useCallback(() => {
    setDataColumn('')
    setLabelColumn('')
    setTitle('')
    setMaxSegments(10)
    setDataColumnSearch('')
    setNumericRanges([])
  }, [])

  const buildPayload = useCallback(() => {
    const finalTitle = title || defaultTitle
    return {
      type: selectedType,
      dataColumn,
      labelColumn: selectedConfig?.variables === 2 ? labelColumn : undefined,
      aggregation,
      title: finalTitle,
      maxSegments,
      numericRanges: shouldShowRangeEditor ? numericRanges : undefined,
    }
  }, [
    title,
    defaultTitle,
    selectedType,
    dataColumn,
    selectedConfig?.variables,
    labelColumn,
    aggregation,
    maxSegments,
    shouldShowRangeEditor,
    numericRanges,
  ])

  return {
    // State
    selectedType,
    setSelectedType,
    dataColumn,
    setDataColumn,
    labelColumn,
    setLabelColumn,
    aggregation,
    setAggregation,
    title,
    setTitle,
    maxSegments,
    setMaxSegments,
    dataColumnSearch,
    setDataColumnSearch,
    numericRanges,
    setNumericRanges,

    // Derived
    selectedConfig,
    availableAggregations,
    availableChartTypes,
    compatibleDataColumns,
    shouldShowRangeEditor,
    sampleValues,
    canSubmit,
    defaultTitle,

    // Actions
    onChangeType,
    resetForm,
    buildPayload,
  }
}

export type UseChartCreationModalReturn = ReturnType<typeof useChartCreationModal>

