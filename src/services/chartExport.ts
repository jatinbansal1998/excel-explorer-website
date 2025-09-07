import { ChartConfig, ChartData } from '@/types/chart'

export class ChartExportService {
  exportToPNG(chartElement: HTMLCanvasElement, title: string): void {
    const link = document.createElement('a')
    link.download = `${title}.png`
    link.href = chartElement.toDataURL('image/png')
    link.click()
  }

  // Placeholder for SVG export. Chart.js renders canvas by default; SVG export would require custom rendering.
  exportToSVG(_chartData: ChartData, _config: ChartConfig): void {
    // Not implemented in this version
    throw new Error('SVG export is not implemented')
  }

  exportChartData(chartData: ChartData, title: string): void {
    const csv = this.convertToCSV(chartData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${title}-data.csv`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  private convertToCSV(chartData: ChartData): string {
    const rows: string[] = []
    const header = ['Label', ...chartData.datasets.map((d) => d.label)].join(',')
    rows.push(header)
    const len = chartData.labels.length
    for (let i = 0; i < len; i++) {
      const row = [
        JSON.stringify(chartData.labels[i] ?? ''),
        ...chartData.datasets.map((d) => String(d.data[i] ?? '')),
      ].join(',')
      rows.push(row)
    }
    return rows.join('\n')
  }
}

export const chartExportService = new ChartExportService()
