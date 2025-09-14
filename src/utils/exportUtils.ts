import {saveAs} from 'file-saver';
import {ErrorHandler, ErrorType} from './errorHandling';

export interface FilterConfig {
  column: string;
  type: 'text' | 'number' | 'date' | 'list';
    values: unknown[];
  active: boolean;
}

export class ExportService {
  exportToCSV(
      data: unknown[][],
    headers: string[], 
    filename: string
  ): void {
    try {
      const csvContent = this.convertToCSV(data, headers);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.FILE_READ_ERROR,
        'Failed to export CSV file',
        error as Error
      );
    }
  }

  async exportToExcel(
      data: unknown[][],
      headers: string[], 
      filename: string,
      sheetName: string = 'Sheet1'
  ): Promise<void> {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.FILE_READ_ERROR,
        'Failed to export Excel file',
        error as Error
      );
    }
  }

  exportFilterConfig(filters: FilterConfig[], filename: string): void {
    try {
      const config = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        filters: filters.map(f => ({
          column: f.column,
          type: f.type,
          values: f.values,
          active: f.active
        }))
      };
      
      const json = JSON.stringify(config, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      saveAs(blob, `${filename}-filters.json`);
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.FILE_READ_ERROR,
        'Failed to export filter configuration',
        error as Error
      );
    }
  }

  exportChartAsPNG(canvasElement: HTMLCanvasElement, filename: string): void {
    try {
      canvasElement.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${filename}.png`);
        } else {
          throw new Error('Failed to create canvas blob');
        }
      }, 'image/png');
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.CHART_ERROR,
        'Failed to export chart as PNG',
        error as Error
      );
    }
  }

  exportChartAsSVG(svgElement: SVGSVGElement, filename: string): void {
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      saveAs(blob, `${filename}.svg`);
    } catch (error) {
      throw ErrorHandler.getInstance().createError(
        ErrorType.CHART_ERROR,
        'Failed to export chart as SVG',
        error as Error
      );
    }
  }

    private convertToCSV(data: unknown[][], headers: string[]): string {
        const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerRow = headers.map(escapeCSV).join(',');
    const dataRows = data.map(row => 
      row.map(escapeCSV).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n');
  }
}
