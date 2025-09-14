import {formatBytes, formatTime, getPerformanceGrade, gradeColor} from '@/utils/performanceUi'
import type {PerformanceSummary} from '@/utils/performanceMonitor'

describe('performanceUi utils', () => {
    describe('formatBytes', () => {
        it('formats zero bytes', () => {
            expect(formatBytes(0)).toBe('0 B')
        })

        it('formats KB/MB/GB thresholds', () => {
            expect(formatBytes(1024)).toBe('1 KB')
            expect(formatBytes(1024 * 1024)).toBe('1 MB')
            expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
        })

        it('formats arbitrary bytes with two decimals', () => {
            expect(formatBytes(1536)).toBe('1.5 KB')
            expect(formatBytes(3.2 * 1024 * 1024)).toBe('3.2 MB')
        })
    })

    describe('formatTime', () => {
        it('formats milliseconds under 1s', () => {
            expect(formatTime(999)).toBe('999ms')
            expect(formatTime(1)).toBe('1ms')
        })

        it('formats seconds under 60s', () => {
            expect(formatTime(1500)).toBe('1.5s')
            expect(formatTime(59000)).toBe('59.0s')
        })

        it('formats minutes for >= 60s', () => {
            expect(formatTime(60000)).toBe('1.0m')
            expect(formatTime(125000)).toBe('2.1m')
        })
    })

    describe('getPerformanceGrade + gradeColor', () => {
        function makeSummary(totalOperations: number, totalTime: number): PerformanceSummary {
            return {
                totalOperations,
                totalTime,
                operations: [],
                memoryInfo: null,
            }
        }

        it('returns N/A when summary is null', () => {
            expect(getPerformanceGrade(null)).toBe('N/A')
            expect(gradeColor('N/A')).toContain('bg-gray')
        })

        it('grades by average time per operation', () => {
            expect(getPerformanceGrade(makeSummary(10, 900))).toBe('A') // 90ms
            expect(getPerformanceGrade(makeSummary(10, 4900))).toBe('B') // 490ms
            expect(getPerformanceGrade(makeSummary(10, 9000))).toBe('C') // 900ms
            expect(getPerformanceGrade(makeSummary(1, 1500))).toBe('D') // 1500ms
        })

        it('maps grade to color classes', () => {
            expect(gradeColor('A')).toBe('bg-green-100 text-green-800')
            expect(gradeColor('B')).toBe('bg-blue-100 text-blue-800')
            expect(gradeColor('C')).toBe('bg-yellow-100 text-yellow-800')
            expect(gradeColor('D')).toBe('bg-red-100 text-red-800')
            expect(gradeColor('N/A')).toBe('bg-gray-100 text-gray-800')
        })
    })
})

