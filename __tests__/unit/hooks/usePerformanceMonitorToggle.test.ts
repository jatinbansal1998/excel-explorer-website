import {act, renderHook} from '@testing-library/react'
import {usePerformanceMonitorToggle} from '@/hooks/usePerformanceMonitorToggle'
import {globalProperties} from '@/types/global'

describe('usePerformanceMonitorToggle', () => {
    it('toggles visibility and registers globally', () => {
        const {result, unmount} = renderHook(() => usePerformanceMonitorToggle())

        expect(result.current.isVisible).toBe(false)

        // Global registration exists
        const reg1 = globalProperties.get<any>('performanceMonitor')
        expect(reg1).toBeTruthy()
        expect(typeof reg1.show).toBe('function')
        expect(typeof reg1.hide).toBe('function')
        expect(typeof reg1.toggle).toBe('function')
        expect(typeof reg1.isVisible).toBe('function')
        expect(reg1.isVisible()).toBe(false)

        act(() => {
            result.current.toggle()
        })
        expect(result.current.isVisible).toBe(true)
        const reg2 = globalProperties.get<any>('performanceMonitor')
        expect(reg2.isVisible()).toBe(true)

        act(() => {
            result.current.hide()
        })
        expect(result.current.isVisible).toBe(false)

        // Cleanup removes global registration
        unmount()
        expect(globalProperties.get('performanceMonitor')).toBeUndefined()
    })
})

