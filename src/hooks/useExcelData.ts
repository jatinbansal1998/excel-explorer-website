"use client";

import { useCallback, useMemo, useState } from 'react';
import type { ExcelData } from '../types/excel';
import { ExcelParser } from '../services/excelParser';

export function useExcelData() {
  const [currentData, setCurrentData] = useState<ExcelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parser = useMemo(() => new ExcelParser(), []);

  const parseFile = useCallback(async (file: File): Promise<ExcelData> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await parser.parseFile(file);
      setCurrentData(data);
      return data;
    } catch (e: any) {
      const msg = e?.message || 'Failed to parse file';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [parser]);

  const reset = useCallback(() => {
    setCurrentData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { parseFile, currentData, isLoading, error, reset } as const;
}
