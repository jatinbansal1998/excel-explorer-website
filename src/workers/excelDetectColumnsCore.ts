import type {ColumnInfo, ColumnStatistics, DataType, ParseOptions} from '@/types/excel'
import {
    coerceBoolean,
    coerceNumber,
    isBooleanLike,
    isDateLike,
    isNullLike,
    isNumberLike,
    parseDateFlexible,
} from '@/utils/dataTypes'

function keyForUnique(v: unknown): unknown {
    if (v instanceof Date) return v.toISOString()
    if (typeof v === 'object' && v !== null) return JSON.stringify(v)
    return v
}

export function detectColumnTypesWorker(
    data: unknown[][],
    options: ParseOptions = {},
): ColumnInfo[] {
    const [firstRow, ...rows] = data
    const headers = extractHeaders(firstRow || [])
    const colCount = headers.length

    const columns: ColumnInfo[] = []
    const trackingCap = options.uniqueValuesTrackingCap ?? 2000
    const returnLimit = options.uniqueValuesReturnLimit ?? 50
    const sampleCount = options.sampleValuesCount ?? 5
    const sampleRows = Math.min(rows.length, 1000)

    const chooseType = (num: number, bool: number, date: number, str: number): DataType => {
        const total = num + bool + date + str
        if (total === 0) return 'string'
        const entries: Array<[DataType, number]> = [
            ['number', num],
            ['boolean', bool],
            ['date', date],
            ['string', str],
        ]
        const nonZero = entries.filter(([, c]) => c > 0)
        if (nonZero.length === 1) return nonZero[0][0]
        const dominant = nonZero.reduce((a, b) => (a[1] > b[1] ? a : b))
        return dominant[1] / total >= 0.8 ? dominant[0] : 'mixed'
    }

    for (let c = 0; c < colCount; c++) {
        let num = 0,
            bool = 0,
            date = 0,
            str = 0
        for (let r = 0; r < sampleRows; r++) {
            const v = rows[r]?.[c]
            if (isNullLike(v)) continue
            if (isBooleanLike(v)) bool++
            else if (isDateLike(v as string | number | Date | boolean)) date++
            else if (isNumberLike(v)) num++
            else str++
        }
        const type = chooseType(num, bool, date, str)

        const uniqueSet = new Set<unknown>()
        let nullCount = 0
        const sampleValues: unknown[] = []
        let minNumber: number | undefined,
            maxNumber: number | undefined,
            sumNumber = 0,
            countNumber = 0
        let minDateMs: number | undefined, maxDateMs: number | undefined

        for (const element of rows) {
            const raw = element?.[c]
            if (isNullLike(raw)) {
                nullCount++
                continue
            }

            let v: unknown = raw
            if (type === 'boolean') v = coerceBoolean(raw)
            else if (type === 'number') v = coerceNumber(raw)
            else if (type === 'date') v = parseDateFlexible(raw)
            else v = typeof raw === 'string' ? raw : String(raw)

            if (v == null) {
                nullCount++
                continue
            }

            if (uniqueSet.size < trackingCap) uniqueSet.add(keyForUnique(v))
            if (sampleValues.length < sampleCount) sampleValues.push(v)

            if (type === 'number' && typeof v === 'number' && Number.isFinite(v)) {
                if (minNumber === undefined || v < minNumber) minNumber = v
                if (maxNumber === undefined || v > maxNumber) maxNumber = v
                sumNumber += v
                countNumber++
            } else if (type === 'date' && v instanceof Date && !isNaN(v.getTime())) {
                const ms = v.getTime()
                if (minDateMs === undefined || ms < minDateMs) minDateMs = ms
                if (maxDateMs === undefined || ms > maxDateMs) maxDateMs = ms
            }
        }

        const uniqueValues = Array.from(uniqueSet).slice(0, returnLimit)

        let statistics: ColumnStatistics | undefined = undefined
        const shouldCompute = options.computeStatistics === true
        if (type === 'number') {
            const stats: ColumnStatistics = {}
            if (minNumber !== undefined) stats.min = minNumber
            if (maxNumber !== undefined) stats.max = maxNumber
            if (shouldCompute && countNumber > 0) {
                stats.average = sumNumber / countNumber
            }
            statistics = stats
        } else if (type === 'date') {
            const stats: ColumnStatistics = {}
            if (minDateMs !== undefined) stats.min = new Date(minDateMs)
            if (maxDateMs !== undefined) stats.max = new Date(maxDateMs)
            statistics = stats
        }

        const info: ColumnInfo = {
            name: headers[c],
            index: c,
            type,
            uniqueValues,
            uniqueCount: uniqueSet.size,
            hasNulls: nullCount > 0,
            nullCount,
            sampleValues,
            statistics,
        }
        columns.push(info)
    }

    return columns
}

export function extractHeaders(firstRow: unknown[]): string[] {
    const headers: string[] = []
    for (let i = 0; i < firstRow.length; i++) {
        let h = firstRow[i]
        if (isNullLike(h)) h = ''
        h = String(h).trim()
        if (!h) h = `Column ${i + 1}`
        headers.push(h as string)
    }
    return headers
}
