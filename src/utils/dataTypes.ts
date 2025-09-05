import { DataType } from '../types/excel';

const TRUE_SET = new Set(['true', '1', 'yes', 'y']);
const FALSE_SET = new Set(['false', '0', 'no', 'n']);

export function isNullLike(v: any): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

export function isBooleanLike(v: any): boolean {
  if (typeof v === 'boolean') return true;
  if (typeof v === 'number') return v === 0 || v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return TRUE_SET.has(s) || FALSE_SET.has(s);
  }
  return false;
}

export function coerceBoolean(v: any): boolean | null {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (TRUE_SET.has(s)) return true;
    if (FALSE_SET.has(s)) return false;
  }
  return null;
}

export function isNumberLike(v: any): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') {
    const s = v.trim();
    if (s === '') return false;
    // Allow commas as thousand separators and dot as decimal
    const normalized = s.replace(/,/g, '');
    const n = Number(normalized);
    return Number.isFinite(n);
  }
  return false;
}

export function coerceNumber(v: any): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;
const DMY_RE = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/;
const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export function parseDateFlexible(v: any): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === 'number') {
    // Could be timestamp (ms) or Excel serial; treat as ms if > 10^10
    if (v > 1e10) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    // Heuristic: Excel serial numbers usually between 1 and 60000 for recent dates
    if (v > 1 && v < 100000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const ms = v * 24 * 60 * 60 * 1000;
      const d = new Date(excelEpoch.getTime() + ms);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (s === '') return null;
    if (ISO_DATE_RE.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    const dmy = DMY_RE.exec(s);
    if (dmy) {
      const d = parseInt(dmy[1], 10);
      const m = parseInt(dmy[2], 10) - 1;
      let y = parseInt(dmy[3], 10);
      if (y < 100) y += 2000;
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
    // e.g., 12 Jan 2024 or Jan 12, 2024
    const lower = s.toLowerCase();
    for (let i = 0; i < MONTH_NAMES.length; i++) {
      if (lower.includes(MONTH_NAMES[i])) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      }
    }
  }
  return null;
}

export function isDateLike(v: any): boolean {
  return parseDateFlexible(v) !== null;
}

export function detectTypeForValues(values: any[]): DataType {
  let num = 0, bool = 0, date = 0, str = 0;
  for (const v of values) {
    if (isNullLike(v)) continue;
    if (isBooleanLike(v)) bool++;
    else if (isNumberLike(v)) num++;
    else if (isDateLike(v)) date++;
    else str++;
  }
  const counts = { number: num, boolean: bool, date: date, string: str } as const;
  const nonZero = Object.entries(counts).filter(([, c]) => c > 0);
  if (nonZero.length === 0) return 'string';
  if (nonZero.length === 1) return nonZero[0][0] as DataType;
  // If one dominates (>=80%), choose it; else mixed
  const total = num + bool + date + str;
  const dominant = nonZero.reduce((a, b) => (a[1] > b[1] ? a : b));
  return dominant[1] / total >= 0.8 ? (dominant[0] as DataType) : 'mixed';
}

export function coerceToType(v: any, type: DataType): any {
  if (isNullLike(v)) return null;
  switch (type) {
    case 'boolean':
      return coerceBoolean(v);
    case 'number':
      return coerceNumber(v);
    case 'date':
      return parseDateFlexible(v);
    case 'string':
    case 'mixed':
    default:
      return typeof v === 'string' ? v : String(v);
  }
}
