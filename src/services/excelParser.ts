import {
  ColumnInfo,
  ColumnStatistics,
  DataType,
  ExcelData,
  ExcelMetadata,
  ValidationResult,
  ParseOptions,
} from '@/types/excel'
import {
  isNullLike,
  isBooleanLike,
  isNumberLike,
  isDateLike,
  coerceBoolean,
  coerceNumber,
  parseDateFlexible,
} from '@/utils/dataTypes'
import { validateFile } from '@/utils/fileValidation'
import { globalProperties } from '@/types/global'

// Import xlsx library with proper error handling for browser compatibility
let XLSX: any
try {
  // Try to import xlsx - this will be bundled by Next.js
  XLSX = require('xlsx')
  // Expose utils for other methods
  globalProperties.setXLSXUtils(XLSX.utils)
} catch (error) {
  console.error('Failed to load xlsx library:', error)
  throw new Error('XLSX library not available. Please ensure the library is properly installed.')
}

export class ExcelParser {
  private getXLSXUtils(): any {
    // Utils are pre-loaded at module level
    const utils = globalProperties.getXLSXUtils()
    if (utils) {
      return utils
    }
    throw new Error('XLSX utils not available. Please ensure the library is properly loaded.')
  }

  private shouldUseWorker(rowCount: number): boolean {
    return rowCount > 10000 && typeof Worker !== 'undefined'
  }

  private async processInWorker(data: any[], options: ParseOptions): Promise<ColumnInfo[]> {
    return new Promise((resolve, reject) => {
      try {
        // Remove non-serializable functions from options before sending to worker
        const workerOptions = {
          ...options,
          progress: undefined, // Remove progress callback as it contains non-serializable functions
        }

        const workerCode = `
          self.onmessage = function(e) {
            const { data, options } = e.data;
            try {
              const columns = detectColumnTypes(data, options);
              self.postMessage(columns);
            } catch (error) {
              self.postMessage({ error: error.message });
            }
          };

          function detectColumnTypes(data, options) {
            const [firstRow, ...rows] = data;
            const headers = extractHeaders(firstRow || []);
            const colCount = headers.length;
            const columns = [];
            const trackingCap = options.uniqueValuesTrackingCap ?? 2000;
            const returnLimit = options.uniqueValuesReturnLimit ?? 50;
            const sampleCount = options.sampleValuesCount ?? 5;
            const sampleRows = Math.min(rows.length, 1000);

            const chooseType = (num, bool, date, str) => {
              const total = num + bool + date + str;
              if (total === 0) return 'string';
              const entries = [['number', num], ['boolean', bool], ['date', date], ['string', str]];
              const nonZero = entries.filter(([, c]) => c > 0);
              if (nonZero.length === 1) return nonZero[0][0];
              const dominant = nonZero.reduce((a, b) => (a[1] > b[1] ? a : b));
              return dominant[1] / total >= 0.8 ? dominant[0] : 'mixed';
            };

            function isNullLike(v) {
              return v === null || v === undefined || v === '';
            }

            function isBooleanLike(v) {
              if (typeof v === 'boolean') return true;
              if (typeof v !== 'string') return false;
              const s = v.toLowerCase().trim();
              return s === 'true' || s === 'false' || s === 'yes' || s === 'no' || s === '1' || s === '0';
            }

            function isNumberLike(v) {
              if (typeof v === 'number' && Number.isFinite(v)) return true;
              if (typeof v !== 'string') return false;
              const s = v.trim();
              return !isNaN(Number(s)) && s !== '';
            }

            function isDateLike(v) {
              if (v instanceof Date && !isNaN(v.getTime())) return true;
              if (typeof v !== 'string') return false;
              const s = v.trim();
              return !isNaN(Date.parse(s));
            }

            function coerceBoolean(v) {
              if (typeof v === 'boolean') return v;
              if (typeof v === 'string') {
                const s = v.toLowerCase().trim();
                if (s === 'true' || s === 'yes' || s === '1') return true;
                if (s === 'false' || s === 'no' || s === '0') return false;
              }
              return Boolean(v);
            }

            function coerceNumber(v) {
              if (typeof v === 'number') return v;
              if (typeof v === 'string') {
                const s = v.trim();
                const n = Number(s);
                return isNaN(n) ? null : n;
              }
              return null;
            }

            function parseDateFlexible(v) {
              if (v instanceof Date) return v;
              if (typeof v === 'number') {
                const d = new Date(v);
                return isNaN(d.getTime()) ? null : d;
              }
              if (typeof v === 'string') {
                const d = new Date(v);
                return isNaN(d.getTime()) ? null : d;
              }
              return null;
            }

            function keyForUnique(v) {
              if (v instanceof Date) return v.toISOString();
              if (typeof v === 'object' && v !== null) return JSON.stringify(v);
              return v;
            }

            function extractHeaders(firstRow) {
              const headers = [];
              for (let i = 0; i < firstRow.length; i++) {
                let h = firstRow[i];
                if (isNullLike(h)) h = '';
                h = String(h).trim();
                if (!h) h = 'Column ' + (i + 1);
                headers.push(h);
              }
              return headers;
            }

            for (let c = 0; c < colCount; c++) {
              let num = 0, bool = 0, date = 0, str = 0;
              for (let r = 0; r < sampleRows; r++) {
                const v = rows[r]?.[c];
                if (isNullLike(v)) continue;
                if (isBooleanLike(v)) bool++;
                else if (isDateLike(v)) date++;
                else if (isNumberLike(v)) num++;
                else str++;
              }
              const type = chooseType(num, bool, date, str);

              const uniqueSet = new Set();
              let nullCount = 0;
              const sampleValues = [];
              let minNumber, maxNumber, sumNumber = 0, countNumber = 0;
              let minDateMs, maxDateMs;

              for (let r = 0; r < rows.length; r++) {
                const raw = rows[r]?.[c];
                if (isNullLike(raw)) {
                  nullCount++;
                  continue;
                }

                let v = raw;
                if (type === 'boolean') v = coerceBoolean(raw);
                else if (type === 'number') v = coerceNumber(raw);
                else if (type === 'date') v = parseDateFlexible(raw);
                else v = typeof raw === 'string' ? raw : String(raw);

                if (v == null) {
                  nullCount++;
                  continue;
                }

                if (uniqueSet.size < trackingCap) uniqueSet.add(keyForUnique(v));
                if (sampleValues.length < sampleCount) sampleValues.push(v);

                if (type === 'number' && typeof v === 'number' && Number.isFinite(v)) {
                  if (minNumber === undefined || v < minNumber) minNumber = v;
                  if (maxNumber === undefined || v > maxNumber) maxNumber = v;
                  sumNumber += v;
                  countNumber++;
                } else if (type === 'date' && v instanceof Date && !isNaN(v.getTime())) {
                  const ms = v.getTime();
                  if (minDateMs === undefined || ms < minDateMs) minDateMs = ms;
                  if (maxDateMs === undefined || ms > maxDateMs) maxDateMs = ms;
                }
              }

              const uniqueValues = Array.from(uniqueSet).slice(0, returnLimit);
              let statistics = undefined;
              const shouldCompute = options.computeStatistics === true;
              if (type === 'number') {
                const stats = {};
                if (minNumber !== undefined) stats.min = minNumber;
                if (maxNumber !== undefined) stats.max = maxNumber;
                if (shouldCompute && countNumber > 0) {
                  stats.average = sumNumber / countNumber;
                }
                statistics = stats;
              } else if (type === 'date') {
                const stats = {};
                if (minDateMs !== undefined) stats.min = new Date(minDateMs);
                if (maxDateMs !== undefined) stats.max = new Date(maxDateMs);
                statistics = stats;
              }

              columns.push({
                name: headers[c],
                index: c,
                type,
                uniqueValues,
                uniqueCount: uniqueSet.size,
                hasNulls: nullCount > 0,
                nullCount,
                sampleValues,
                statistics,
              });
            }
            return columns;
          }
        `

        const blob = new Blob([workerCode], { type: 'application/javascript' })
        const worker = new Worker(URL.createObjectURL(blob))

        worker.onmessage = (e) => {
          if (e.data && e.data.error) {
            reject(new Error(e.data.error))
          } else {
            resolve(e.data)
          }
          worker.terminate()
        }

        worker.onerror = (error) => {
          reject(new Error(`Web Worker error: ${error.message}`))
          worker.terminate()
        }

        worker.postMessage({ data, options: workerOptions })
      } catch (error) {
        reject(error)
      }
    })
  }

  async parseFile(file: File, options: ParseOptions = {}): Promise<ExcelData> {
    const progress = options.progress
    progress?.({ stage: 'validating', message: 'Validating file' })
    const validation = validateFile(file)
    if (!validation.ok) {
      const err = new Error(validation.errors.join('; '))
      ;(err as any).details = validation
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
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.onabort = () => reject(new Error('File read was aborted'))
      reader.onprogress = (ev: ProgressEvent<FileReader>) => {
        const total = ev.total > 0 ? ev.total : file.size
        const loaded = ev.loaded
        const percent = total ? (loaded / total) * 100 : undefined
        progress?.({ stage: 'reading', loaded, total, percent, message: 'Reading file' })
      }
      reader.onload = () => resolve(reader.result as any)
      if (isCsv) reader.readAsText(file)
      else reader.readAsArrayBuffer(file)
    })

    progress?.({ stage: 'parsing_workbook', message: 'Parsing workbook' })
    const workbook = isCsv
      ? XLSX.read(content as string, { type: 'string', dense: true })
      : XLSX.read(content as ArrayBuffer, {
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
      // @ts-ignore File may have lastModified
      if ((file as any).lastModified) {
        data.metadata.lastModified = new Date((file as any).lastModified)
      }
    } catch {}
    return data
  }

  async parseWorkbook(
    workbook: any,
    sheetName?: string,
    options: ParseOptions = {},
  ): Promise<ExcelData> {
    const sheetNames: string[] = workbook.SheetNames || []
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

    const sheet = workbook.Sheets[activeSheet]
    const utils: any = this.getXLSXUtils()
    const aoa: any[][] = utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false,
    })

    const firstRow = (aoa[0] || []) as any[]
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

    const rows: any[][] = []
    // Trim trailing completely empty rows to avoid showing blank rows in the UI table
    const isRowCompletelyEmpty = (row: any[] | undefined): boolean => {
      if (!row) return true
      for (let i = 0; i < row.length; i++) {
        if (!isNullLike(row[i])) return false
      }
      return true
    }
    let lastDataIndex = aoa.length - 1
    while (lastDataIndex >= 1 && isRowCompletelyEmpty(aoa[lastDataIndex])) {
      lastDataIndex--
    }
    const totalRows = Math.max(lastDataIndex, 0)

    // Use chunked processing for very large datasets
    const chunkSize = Math.min(5000, totalRows)
    const progressInterval = Math.max(1, Math.floor(totalRows / 20))

    for (let chunkStart = 1; chunkStart <= lastDataIndex; chunkStart += chunkSize) {
      const chunkEnd = Math.min(chunkStart + chunkSize - 1, lastDataIndex)

      // Process chunk
      for (let r = chunkStart; r <= chunkEnd; r++) {
        const row = aoa[r]
        const arr: any[] = []
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
      if (totalRows > 10000 && chunkEnd < lastDataIndex) {
        await new Promise((resolve) => setTimeout(resolve, 0))
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

    options.progress?.({ stage: 'complete', message: 'Parsing complete', sheetName: activeSheet })
    return { headers, rows, metadata }
  }

  detectColumnTypes(data: any[][], options: ParseOptions = {}): ColumnInfo[] {
    const [firstRow, ...rows] = data
    const headers = this.extractHeaders(firstRow || [])
    const colCount = headers.length

    const columns: ColumnInfo[] = []
    const trackingCap = options.uniqueValuesTrackingCap ?? 2000
    const returnLimit = options.uniqueValuesReturnLimit ?? 50
    const sampleCount = options.sampleValuesCount ?? 5
    const sampleRows = Math.min(rows.length, 1000)

    // Helper to choose type from sample counts
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
      // 1) Detect type from a bounded sample
      let num = 0,
        bool = 0,
        date = 0,
        str = 0
      for (let r = 0; r < sampleRows; r++) {
        const v = rows[r]?.[c]
        if (isNullLike(v)) continue
        if (isBooleanLike(v)) bool++
        else if (isDateLike(v)) date++
        else if (isNumberLike(v)) num++
        else str++
      }
      const type: DataType = chooseType(num, bool, date, str)

      // 2) Single pass over all rows to collect metadata cheaply
      const uniqueSet = new Set<any>()
      let nullCount = 0
      const sampleValues: any[] = []

      // Lightweight stats
      let minNumber: number | undefined = undefined
      let maxNumber: number | undefined = undefined
      let sumNumber = 0
      let countNumber = 0

      let minDateMs: number | undefined = undefined
      let maxDateMs: number | undefined = undefined

      for (let r = 0; r < rows.length; r++) {
        const raw = rows[r]?.[c]
        if (isNullLike(raw)) {
          nullCount++
          continue
        }

        let v: any = raw
        if (type === 'boolean') v = coerceBoolean(raw)
        else if (type === 'number') v = coerceNumber(raw)
        else if (type === 'date') v = parseDateFlexible(raw)
        else v = typeof raw === 'string' ? raw : String(raw)

        if (v == null) {
          nullCount++
          continue
        }

        if (uniqueSet.size < trackingCap) uniqueSet.add(this.keyForUnique(v))
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
      // Only compute lightweight stats by default; heavier ones must be opted-in
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

  calculateStatistics(column: any[], type: DataType): ColumnStatistics {
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
      stats.mode = best as any
    } else if (type === 'date') {
      const dates = column.filter(
        (v) => v instanceof Date && !isNaN((v as Date).getTime()),
      ) as Date[]
      if (dates.length === 0) return stats
      dates.sort((a, b) => a.getTime() - b.getTime())
      stats.min = dates[0]
      stats.max = dates[dates.length - 1]
      // average for dates omitted to avoid ambiguity
    }
    return stats
  }

  extractHeaders(firstRow: any[]): string[] {
    const headers: string[] = []
    for (let i = 0; i < firstRow.length; i++) {
      let h = firstRow[i]
      if (isNullLike(h)) h = ''
      h = String(h).trim()
      if (!h) h = `Column ${i + 1}`
      headers.push(h)
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
      results.push({ path: 'rows', level: 'info', message: 'No data rows found.' })
    }
    return results
  }

  private keyForUnique(v: any): any {
    if (v instanceof Date) return v.toISOString()
    if (typeof v === 'object' && v !== null) return JSON.stringify(v)
    return v
  }
}
