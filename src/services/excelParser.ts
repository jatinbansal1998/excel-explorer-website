import {
    ColumnInfo,
    ColumnStatistics,
    DataType,
    ExcelData,
    ExcelMetadata,
    ParseOptions,
    ValidationResult,
} from '@/types/excel'
import {isNullLike,} from '@/utils/dataTypes'
import {validateFile} from '@/utils/fileValidation'
import {globalProperties} from '@/types/global'
import {ErrorHandler, ErrorType} from '@/utils/errorHandling'
import {detectColumnTypesWorker} from '@/workers/excelDetectColumnsCore'

// Tuning constants (avoid magic numbers and clarify intent)
const WORKER_ROW_THRESHOLD = 10000
const CHUNK_SIZE_CAP = 5000
const PROGRESS_PARTITIONS = 20
const UI_YIELD_MS = 0

// Import xlsx library with proper error handling for browser compatibility
let XLSX: Record<string, unknown>
let xlsxLoaded = false

// Function to load XLSX library
async function loadXLSX() {
    if (!xlsxLoaded) {
        try {
            // Try to import xlsx - this will be bundled by Next.js
            XLSX = await import('xlsx')
            // Expose utils for other methods
            globalProperties.setXLSXUtils(XLSX.utils)
            xlsxLoaded = true
        } catch (error) {
            throw ErrorHandler.getInstance().createError(
                ErrorType.BROWSER_ERROR,
                'XLSX library not available. Please ensure the library is properly installed.',
                error as Error,
            )
        }
    }
    return XLSX
}

export class ExcelParser {
    private getXLSXUtils(): Record<string, unknown> {
        // Utils are pre-loaded at module level
        const utils = globalProperties.getXLSXUtils()
        if (utils) {
            return utils as Record<string, unknown>
        }
        throw ErrorHandler.getInstance().createError(
            ErrorType.BROWSER_ERROR,
            'XLSX utils not available. Please ensure the library is properly loaded.',
        )
    }

    private shouldUseWorker(rowCount: number): boolean {
        return rowCount > WORKER_ROW_THRESHOLD && typeof Worker !== 'undefined'
    }

    // Resolve the worker URL in environments that don’t support import.meta at runtime (e.g., Jest).
    // The use of Function here is tightly scoped and only reads module metadata; no user input is evaluated.
    // This prevents syntax errors in test runners that don’t support import.meta, while keeping bundlers happy.
    private resolveWorkerUrl(): URL | null {
        try {
            // eslint-disable-next-line no-new-func
            const meta = Function('return import.meta')() as { url?: string } | undefined
            if (meta?.url) {
                return new URL('../workers/excelDetectColumns.worker.ts', meta.url)
            }
        } catch {
            // Intentionally ignored: in non-ESM environments, fall back handled by caller
        }
        return null
    }

    private async processInWorker(data: unknown[], options: ParseOptions): Promise<ColumnInfo[]> {
        const workerOptions = {...options, progress: undefined}
        return new Promise((resolve, reject) => {
            try {
                const workerUrl = this.resolveWorkerUrl()
                if (!workerUrl) throw new Error('Worker URL resolution failed')

                const worker = new Worker(workerUrl, {type: 'module'})

                worker.onmessage = (e: MessageEvent) => {
                    const payload = e.data
                    if (payload && payload.error) {
                        const appErr = ErrorHandler.getInstance().createError(
                            ErrorType.PARSE_ERROR,
                            String(payload.error),
                        )
                        reject(appErr)
                    } else {
                        resolve(payload as ColumnInfo[])
                    }
                    worker.terminate()
                }

                worker.onerror = (error) => {
                    const appErr = ErrorHandler.getInstance().createError(
                        ErrorType.BROWSER_ERROR,
                        `Web Worker error: ${error.message}`,
                    )
                    worker.terminate()
                    reject(appErr)
                }

                worker.postMessage({data, options: workerOptions})
            } catch {
                // Fallback: run the same logic on main thread asynchronously
                setTimeout(() => {
                    try {
                        const result = detectColumnTypesWorker(data as unknown[][], workerOptions)
                        resolve(result)
                    } catch (e) {
                        const appErr = ErrorHandler.getInstance().createError(
                            ErrorType.PARSE_ERROR,
                            (e as Error)?.message || 'Failed to analyze columns',
                            e as Error,
                        )
                        reject(appErr)
                    }
                }, UI_YIELD_MS)
            }
        })
    }

    async parseFile(file: File, options: ParseOptions = {}): Promise<ExcelData> {
        const progress = options.progress
        progress?.({stage: 'validating', message: 'Validating file'})
        const validation = validateFile(file)
        if (!validation.ok) {
            const err = ErrorHandler.getInstance().createError(
                    ErrorType.FILE_TYPE_ERROR,
                    validation.errors.join('; '),
                )
            ;(err as unknown as { details?: unknown }).details = validation
            throw err
        }

        const isCsv = /\.csv$/i.test(file.name)
        progress?.({
            stage: 'reading',
            message: 'Reading file',
            total: file.size,
            loaded: 0,
            percent: 0,
        })
        const content = await new Promise<string | ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader()
            reader.onerror = () =>
                reject(
                    ErrorHandler.getInstance().createError(
                        ErrorType.FILE_READ_ERROR,
                        'Failed to read file',
                    ),
                )
            reader.onabort = () =>
                reject(
                    ErrorHandler.getInstance().createError(
                        ErrorType.FILE_READ_ERROR,
                        'File read was aborted',
                    ),
                )
            reader.onprogress = (ev: ProgressEvent<FileReader>) => {
                const total = ev.total > 0 ? ev.total : file.size
                const loaded = ev.loaded
                const percent = total ? (loaded / total) * 100 : undefined
                progress?.({stage: 'reading', loaded, total, percent, message: 'Reading file'})
            }
            reader.onload = () => resolve(reader.result as string | ArrayBuffer)
            if (isCsv) reader.readAsText(file)
            else reader.readAsArrayBuffer(file)
        })

        progress?.({stage: 'parsing_workbook', message: 'Parsing workbook'})
        const xlsx = await loadXLSX()
        const workbook = isCsv
            ? (
                xlsx as Record<
                    string,
                    (content: string, options: Record<string, unknown>) => Record<string, unknown>
                >
            ).read(content as string, {
                type: 'string',
                dense: true,
            })
            : (
                xlsx as Record<
                    string,
                    (content: ArrayBuffer, options: Record<string, unknown>) => Record<string, unknown>
                >
            ).read(content as ArrayBuffer, {
                type: 'array',
                dense: true,
                cellDates: true,
                cellNF: false,
                cellText: false,
            })
        const data = await this.parseWorkbook(workbook, options.sheetName, options)
        // Fill file metadata details
        data.metadata.fileName = file.name
        data.metadata.fileSize = file.size
        try {
            const lm = (file as File & { lastModified?: number }).lastModified
            if (lm) {
                data.metadata.lastModified = new Date(lm)
            }
        } catch {
            // Non-fatal: lastModified may be inaccessible in some environments
        }
        return data
    }

    async parseWorkbook(
        workbook: Record<string, unknown>,
        sheetName?: string,
        options: ParseOptions = {},
    ): Promise<ExcelData> {
        const sheetNames: string[] = (workbook.SheetNames as string[]) || []
        const activeSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0]
        if (!activeSheet) {
            return {
                headers: [],
                rows: [],
                metadata: {
                    fileName: '',
                    sheetNames: [],
                    activeSheet: '',
                    totalRows: 0,
                    totalColumns: 0,
                    columns: [],
                    fileSize: 0,
                },
            }
        }

        const sheet = (workbook as Record<string, Record<string, unknown>>).Sheets?.[activeSheet]
        const utils = this.getXLSXUtils()
        const aoa: unknown[][] = (
            utils as Record<string, (sheet: unknown, options: Record<string, unknown>) => unknown[][]>
        ).sheet_to_json(sheet, {
            header: 1,
            raw: true,
            defval: null,
            blankrows: false,
        })

        const firstRow = (aoa[0] || [])
        options.progress?.({
            stage: 'extracting_headers',
            message: 'Extracting headers',
            sheetName: activeSheet,
        })
        const headers = this.extractHeaders(firstRow)

        options.progress?.({
            stage: 'building_rows',
            message: 'Building rows',
            sheetName: activeSheet,
            total: Math.max(aoa.length - 1, 0),
            loaded: 0,
            percent: 0,
        })

        const rows: unknown[][] = []
        // Trim trailing completely empty rows to avoid showing blank rows in the UI table
        const isRowCompletelyEmpty = (row: unknown[] | undefined): boolean => {
            if (!row) return true
            for (const element of row) {
                if (!isNullLike(element)) return false
            }
            return true
        }
        let lastDataIndex = aoa.length - 1
        while (lastDataIndex >= 1 && isRowCompletelyEmpty(aoa[lastDataIndex])) {
            lastDataIndex--
        }
        const totalRows = Math.max(lastDataIndex, 0)

        // Use chunked processing for very large datasets
        const chunkSize = Math.min(CHUNK_SIZE_CAP, totalRows)
        const progressInterval = Math.max(1, Math.floor(totalRows / PROGRESS_PARTITIONS))

        for (let chunkStart = 1; chunkStart <= lastDataIndex; chunkStart += chunkSize) {
            const chunkEnd = Math.min(chunkStart + chunkSize - 1, lastDataIndex)

            // Process chunk
            for (let r = chunkStart; r <= chunkEnd; r++) {
                const row = aoa[r]
                const arr: unknown[] = []
                for (let i = 0; i < headers.length; i++) arr.push(row?.[i] ?? null)
                rows.push(arr)
            }

            // Report progress
            if (chunkEnd % progressInterval === 0 || chunkEnd === lastDataIndex) {
                const loaded = chunkEnd
                const percent = totalRows ? (loaded / totalRows) * 100 : 100
                options.progress?.({
                    stage: 'building_rows',
                    message: `Building rows (${Math.floor((chunkEnd / totalRows) * 100)}% complete)`,
                    sheetName: activeSheet,
                    total: totalRows,
                    loaded,
                    percent,
                })
            }

            // Allow UI to breathe between chunks for very large datasets
            if (totalRows > WORKER_ROW_THRESHOLD && chunkEnd < lastDataIndex) {
                await new Promise((resolve) => setTimeout(resolve, UI_YIELD_MS))
            }
        }

        options.progress?.({
            stage: 'analyzing_columns',
            message: 'Analyzing columns',
            sheetName: activeSheet,
        })

        let columns: ColumnInfo[]
        if (this.shouldUseWorker(rows.length)) {
            options.progress?.({
                stage: 'analyzing_columns',
                message: 'Analyzing columns using Web Worker for optimal performance',
                sheetName: activeSheet,
            })
            columns = await this.processInWorker([firstRow, ...rows], options)
        } else {
            columns = this.detectColumnTypes([firstRow, ...rows], options)
        }

        const metadata: ExcelMetadata = {
            fileName: '',
            sheetNames,
            activeSheet,
            totalRows: rows.length,
            totalColumns: headers.length,
            columns,
            fileSize: 0,
        }

        options.progress?.({stage: 'complete', message: 'Parsing complete', sheetName: activeSheet})

        // Convert null values to empty strings to match the expected type
        const cleanedRows = rows.map((row) =>
            row.map((cell) => (cell ?? '')),
        ) as ExcelData['rows']

        return {headers, rows: cleanedRows, metadata}
    }

    detectColumnTypes(data: unknown[][], options: ParseOptions = {}): ColumnInfo[] {
        return detectColumnTypesWorker(data, options)
    }

    calculateStatistics(column: unknown[], type: DataType): ColumnStatistics {
        const stats: ColumnStatistics = {}
        if (type === 'number') {
            const nums = column
                .map((v) => (typeof v === 'number' ? v : null))
                .filter((v): v is number => v !== null && Number.isFinite(v))
            if (nums.length === 0) return stats
            nums.sort((a, b) => a - b)
            stats.min = nums[0]
            stats.max = nums[nums.length - 1]
            const sum = nums.reduce((a, b) => a + b, 0)
            stats.average = sum / nums.length
            const mid = Math.floor(nums.length / 2)
            stats.median = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid]
            // mode
            const freq = new Map<number, number>()
            let best: number | null = null
            let bestCount = 0
            for (const n of nums) {
                const c = (freq.get(n) || 0) + 1
                freq.set(n, c)
                if (c > bestCount) {
                    best = n
                    bestCount = c
                }
            }
            stats.mode = best
        } else if (type === 'date') {
            const dates = column.filter(
                (v) => v instanceof Date && !isNaN((v).getTime()),
            ) as Date[]
            if (dates.length === 0) return stats
            dates.sort((a, b) => a.getTime() - b.getTime())
            stats.min = dates[0]
            stats.max = dates[dates.length - 1]
            // average for dates omitted to avoid ambiguity
        }
        return stats
    }

    extractHeaders(firstRow: unknown[]): string[] {
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

    validateData(data: ExcelData): ValidationResult[] {
        const results: ValidationResult[] = []
        // Duplicate headers
        const seen = new Map<string, number>()
        data.headers.forEach((h, idx) => {
            const key = h.toLowerCase()
            if (seen.has(key)) {
                results.push({
                    path: `header[${idx}]`,
                    level: 'warning',
                    message: `Duplicate header '${h}'`,
                })
            } else {
                seen.set(key, idx)
            }
        })
        // Empty dataset
        if (data.rows.length === 0) {
            results.push({path: 'rows', level: 'info', message: 'No data rows found.'})
        }
        return results
    }

    // Detection helpers are in the shared worker core implementation
}
