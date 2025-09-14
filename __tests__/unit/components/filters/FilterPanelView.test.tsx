import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterPanelView from '@/components/presentational/filters/FilterPanelView'
import type {FilterConfig} from '@/types/filter'

function makeFilter(id: string, displayName = 'Filter name'): FilterConfig {
    return {
        id,
        displayName,
        column: 'col',
        columnIndex: 0,
        type: 'search',
        active: false,
        values: {query: '', caseSensitive: false, exactMatch: false},
        operator: 'contains',
    }
}

describe('FilterPanelView', () => {
    userEvent.setup()

    it('renders header and search when expanded, hides search when collapsed', () => {
        const onToggleCollapsed = jest.fn()
        const onChangeQuery = jest.fn()
        const onResetAll = jest.fn()
        const filters = [makeFilter('1'), makeFilter('2')]

        const {rerender} = render(
            <FilterPanelView
                collapsed={false}
                onToggleCollapsed={onToggleCollapsed}
                filterListQuery=""
                onChangeQuery={onChangeQuery}
                filters={filters}
                onResetAll={onResetAll}
                renderFilterItem={(f) => <div>item-{f.id}</div>}
            />,
        )

        // Search input visible when expanded
        expect(screen.getByRole('textbox')).toBeInTheDocument()
        // Clicking collapse button calls handler
        const collapseBtn = screen.getByRole('button', {name: /collapse filters|expand filters/i})
        expect(collapseBtn).toBeInTheDocument()

        // Reset all button visible when expanded
        expect(screen.getByRole('button', {name: /reset all filters/i})).toBeInTheDocument()

        // List renders items via render prop
        expect(screen.getByText('item-1')).toBeInTheDocument()
        expect(screen.getByText('item-2')).toBeInTheDocument()

        // Collapse state
        rerender(
            <FilterPanelView
                collapsed
                onToggleCollapsed={onToggleCollapsed}
                filterListQuery=""
                onChangeQuery={onChangeQuery}
                filters={filters}
                onResetAll={onResetAll}
                renderFilterItem={(f) => <div>item-{f.id}</div>}
            />,
        )

        expect(screen.queryByPlaceholderText(/search filters/i)).not.toBeInTheDocument()
        // Reset all hidden when collapsed
        expect(screen.queryByRole('button', {name: /reset all filters/i})).not.toBeInTheDocument()
    })

    it('invokes callbacks for collapse toggle, search query, and reset all', async () => {
        const user = userEvent.setup()
        const onToggleCollapsed = jest.fn()
        const onChangeQuery = jest.fn()
        const onResetAll = jest.fn()
        const filters = [makeFilter('1')]

        render(
            <FilterPanelView
                collapsed={false}
                onToggleCollapsed={onToggleCollapsed}
                filterListQuery=""
                onChangeQuery={onChangeQuery}
                filters={filters}
                onResetAll={onResetAll}
                renderFilterItem={(f) => <div>item-{f.id}</div>}
            />,
        )

        await user.click(screen.getByRole('button', {name: /collapse filters/i}))
        expect(onToggleCollapsed).toHaveBeenCalled()

        await user.type(screen.getByRole('textbox'), 'abc')
        expect(onChangeQuery).toHaveBeenCalled()

        await user.click(screen.getByRole('button', {name: /reset all filters/i}))
        expect(onResetAll).toHaveBeenCalled()
    })
})
