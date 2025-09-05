import { ColumnInfo, ColumnStatistics, DataType, ExcelData, ExcelMetadata, ValidationResult } from '../types/excel';
import { coerceToType, detectTypeForValues, isNullLike } from '../utils/dataTypes';
import { validateFile } from '../utils/fileValidation';

export class ExcelParser {
  private getXLSXUtils(): any {
    // Utils are set by parseFile to avoid SSR import issues
    if (typeof globalThis !== 'undefined' && (globalThis as any).__XLSX_UTILS) {
      return (globalThis as any).__XLSX_UTILS;
    }
    throw new Error('XLSX utils not available. Use parseFile() in browser context.');
  }

  async parseFile(file: File): Promise<ExcelData> {
    const validation = validateFile(file);
    if (!validation.ok) {
      const err = new Error(validation.errors.join('; '));
      (err as any).details = validation;
      throw err;
    }

    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onabort = () => reject(new Error('File read was aborted'));
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(file);
    });

    // Dynamic import to avoid SSR issues
    const XLSX: any = await import('xlsx');
    // Expose utils for other methods
    ;(globalThis as any).__XLSX_UTILS = XLSX.utils;

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const data = this.parseWorkbook(workbook);
    // Fill file metadata details
    data.metadata.fileName = file.name;
    data.metadata.fileSize = file.size;
    try {
      // @ts-ignore File may have lastModified
      if ((file as any).lastModified) {
        data.metadata.lastModified = new Date((file as any).lastModified);
      }
    } catch {}
    return data;
  }

  parseWorkbook(workbook: any, sheetName?: string): ExcelData {
    const sheetNames: string[] = workbook.SheetNames || [];
    const activeSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
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
      };
    }

    const sheet = workbook.Sheets[activeSheet];
    const utils: any = this.getXLSXUtils();
    const aoa: any[][] = utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });

    const firstRow = (aoa[0] || []) as any[];
    const headers = this.extractHeaders(firstRow);

    const rows: any[][] = aoa.slice(1).map((row) => {
      const arr: any[] = [];
      for (let i = 0; i < headers.length; i++) arr.push(row[i] ?? null);
      return arr;
    });

    const columns = this.detectColumnTypes([firstRow, ...rows]);

    const metadata: ExcelMetadata = {
      fileName: '',
      sheetNames,
      activeSheet,
      totalRows: rows.length,
      totalColumns: headers.length,
      columns,
      fileSize: 0,
    };

    return { headers, rows, metadata };
  }

  detectColumnTypes(data: any[][]): ColumnInfo[] {
    const [firstRow, ...rows] = data;
    const headers = this.extractHeaders(firstRow || []);
    const colCount = headers.length;

    const columns: ColumnInfo[] = [];
    for (let c = 0; c < colCount; c++) {
      const colValues = rows.map((r) => r?.[c]);
      const type: DataType = detectTypeForValues(colValues);
      const coerced = colValues.map((v) => coerceToType(v, type));

      const uniqueSet = new Set<any>();
      let nullCount = 0;
      const sampleValues: any[] = [];
      for (let i = 0; i < coerced.length; i++) {
        const v = coerced[i];
        if (isNullLike(v)) {
          nullCount++;
        } else {
          if (uniqueSet.size < 2000) uniqueSet.add(this.keyForUnique(v)); // cap memory
          if (sampleValues.length < 5) sampleValues.push(v);
        }
      }

      const uniqueValues = Array.from(uniqueSet).slice(0, 50); // limit to 50 for metadata
      const info: ColumnInfo = {
        name: headers[c],
        index: c,
        type,
        uniqueValues,
        uniqueCount: uniqueSet.size,
        hasNulls: nullCount > 0,
        nullCount,
        sampleValues,
        statistics: this.calculateStatistics(coerced, type),
      };
      columns.push(info);
    }
    return columns;
  }

  calculateStatistics(column: any[], type: DataType): ColumnStatistics {
    const stats: ColumnStatistics = {};
    if (type === 'number') {
      const nums = column.map((v) => (typeof v === 'number' ? v : null)).filter((v): v is number => v !== null && Number.isFinite(v));
      if (nums.length === 0) return stats;
      nums.sort((a, b) => a - b);
      stats.min = nums[0];
      stats.max = nums[nums.length - 1];
      const sum = nums.reduce((a, b) => a + b, 0);
      stats.average = sum / nums.length;
      const mid = Math.floor(nums.length / 2);
      stats.median = nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
      // mode
      const freq = new Map<number, number>();
      let best: number | null = null;
      let bestCount = 0;
      for (const n of nums) {
        const c = (freq.get(n) || 0) + 1;
        freq.set(n, c);
        if (c > bestCount) {
          best = n;
          bestCount = c;
        }
      }
      stats.mode = best as any;
    } else if (type === 'date') {
      const dates = column.filter((v) => v instanceof Date && !isNaN((v as Date).getTime())) as Date[];
      if (dates.length === 0) return stats;
      dates.sort((a, b) => a.getTime() - b.getTime());
      stats.min = dates[0];
      stats.max = dates[dates.length - 1];
      // average for dates omitted to avoid ambiguity
    }
    return stats;
  }

  extractHeaders(firstRow: any[]): string[] {
    const headers: string[] = [];
    for (let i = 0; i < firstRow.length; i++) {
      let h = firstRow[i];
      if (isNullLike(h)) h = '';
      h = String(h).trim();
      if (!h) h = `Column ${i + 1}`;
      headers.push(h);
    }
    return headers;
  }

  validateData(data: ExcelData): ValidationResult[] {
    const results: ValidationResult[] = [];
    // Duplicate headers
    const seen = new Map<string, number>();
    data.headers.forEach((h, idx) => {
      const key = h.toLowerCase();
      if (seen.has(key)) {
        results.push({ path: `header[${idx}]`, level: 'warning', message: `Duplicate header '${h}'` });
      } else {
        seen.set(key, idx);
      }
    });
    // Empty dataset
    if (data.rows.length === 0) {
      results.push({ path: 'rows', level: 'info', message: 'No data rows found.' });
    }
    return results;
  }

  private keyForUnique(v: any): any {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && v !== null) return JSON.stringify(v);
    return v;
  }
}
