import {useCallback, useEffect, useState} from 'react'
import {globalProperties} from '@/types/global'

export function usePerformanceMonitorToggle() {
    const [isVisible, setIsVisible] = useState(false)

    const toggle = useCallback(() => setIsVisible((v) => !v), [])
    const show = useCallback(() => setIsVisible(true), [])
    const hide = useCallback(() => setIsVisible(false), [])

    useEffect(() => {
        globalProperties.set('performanceMonitor', {
            show,
            hide,
            toggle,
            isVisible: () => isVisible,
        })

        return () => {
            try {
                globalProperties.remove('performanceMonitor')
            } catch {
            }
        }
    }, [isVisible, show, hide, toggle])

    return {isVisible, toggle, show, hide}
}

// Backward-friendly alias for familiarity
export function usePerformanceMonitor() {
    return usePerformanceMonitorToggle()
}

