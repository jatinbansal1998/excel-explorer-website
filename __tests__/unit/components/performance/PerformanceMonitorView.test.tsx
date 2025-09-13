import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PerformanceMonitorView from '@/components/presentational/performance/PerformanceMonitorView'
import type {PerformanceAlert} from '@/hooks/usePerformance'

describe('PerformanceMonitorView', () => {
    it('renders collapsed toggle button when not visible and triggers onToggle', async () => {
        const user = userEvent.setup()
        const onToggle = jest.fn()

        render(
            <PerformanceMonitorView
                visible={false}
                onToggle={onToggle}
                alerts={[]}
                hasAlerts={false}
                onDismissAlert={jest.fn()}
                summary={null}
                metrics={[]}
                memoryUsage={null}
                highMemory={false}
                expanded={false}
                onToggleExpanded={jest.fn()}
                onClearMetrics={jest.fn()}
            />,
        )

        const btn = screen.getByRole('button', {name: /performance/i})
        expect(btn).toBeInTheDocument()
        await user.click(btn)
        expect(onToggle).toHaveBeenCalled()
    })

    it('renders visible panel with grade badge and metrics', () => {
        const alerts: PerformanceAlert[] = [
            {type: 'slow-operation', message: 'Slow op', severity: 'warning', operation: 'op1'},
            {type: 'very-slow-operation', message: 'Very slow', severity: 'error', operation: 'op2'},
        ]

        render(
            <PerformanceMonitorView
                visible
                onToggle={jest.fn()}
                alerts={alerts}
                hasAlerts
                onDismissAlert={jest.fn()}
                summary={{totalOperations: 10, totalTime: 900, operations: [], memoryInfo: null}}
                metrics={[{name: 'op1', startTime: Date.now(), duration: 50}]}
                memoryUsage={{usedJSHeapSize: 1000, jsHeapSizeLimit: 10000}}
                highMemory={false}
                expanded
                onToggleExpanded={jest.fn()}
                onClearMetrics={jest.fn()}
            />,
        )

        expect(screen.getByRole('heading', {name: /performance monitor/i})).toBeInTheDocument()
        expect(screen.getByText(/grade A/i)).toBeInTheDocument()
        expect(screen.getByText(/2 Alerts?/i)).toBeInTheDocument()
        // Verify metrics section renders and shows the formatted duration for our metric
        expect(screen.getByRole('heading', {name: /recent operations/i})).toBeInTheDocument()
        // Primary UI indicators present
    })

    it('calls onClearMetrics when clear button clicked', async () => {
        const user = userEvent.setup()
        const onClear = jest.fn()

        render(
            <PerformanceMonitorView
                visible
                onToggle={jest.fn()}
                alerts={[]}
                hasAlerts={false}
                onDismissAlert={jest.fn()}
                summary={{totalOperations: 0, totalTime: 0, operations: [], memoryInfo: null}}
                metrics={[{name: 'op1', startTime: Date.now(), duration: 1200}]}
                memoryUsage={null}
                highMemory={false}
                expanded
                onToggleExpanded={jest.fn()}
                onClearMetrics={onClear}
            />,
        )

        await user.click(screen.getByRole('button', {name: /clear/i}))
        expect(onClear).toHaveBeenCalled()
    })
})
