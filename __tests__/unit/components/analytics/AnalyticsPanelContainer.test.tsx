import React from 'react'
import {render, screen} from '@testing-library/react'
import {AnalyticsPanel} from '@/components/analytics/AnalyticsPanel'
import {OpenRouterProvider} from '@/hooks/useOpenRouter'

describe('AnalyticsPanel (container)', () => {
    test('renders without crashing with minimal props', () => {
        render(
            <OpenRouterProvider>
                <AnalyticsPanel excelData={null}/>
            </OpenRouterProvider>,
        )

        expect(screen.getByRole('heading', {name: /AI Insights/i})).toBeInTheDocument()
    })
})
