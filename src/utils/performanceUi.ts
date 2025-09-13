import type {PerformanceSummary} from '@/utils/performanceMonitor'

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
}

export function getPerformanceGrade(summary: PerformanceSummary | null): string {
    if (!summary) return 'N/A'
    const avgTime = summary.totalTime / Math.max(summary.totalOperations, 1)
    if (avgTime < 100) return 'A'
    if (avgTime < 500) return 'B'
    if (avgTime < 1000) return 'C'
    return 'D'
}

export function gradeColor(grade: string): string {
    switch (grade) {
        case 'A':
            return 'bg-green-100 text-green-800'
        case 'B':
            return 'bg-blue-100 text-blue-800'
        case 'C':
            return 'bg-yellow-100 text-yellow-800'
        case 'D':
            return 'bg-red-100 text-red-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

