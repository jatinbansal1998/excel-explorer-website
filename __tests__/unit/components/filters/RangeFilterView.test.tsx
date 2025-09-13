import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RangeFilterView from '@/components/presentational/filters/RangeFilterView'
import type {FilterConfig, RangeFilter} from '@/types/filter'
import type {ColumnInfo} from '@/types/excel'

const columnInfo: ColumnInfo[] = [
    {
        name: 'col',
        index: 0,
        type: 'number',
        uniqueValues: [],
        uniqueCount: 0,
        hasNulls: false,
        nullCount: 0,
        sampleValues: [],
    },
]
const filteredData: (string | number | boolean | Date)[][] = []

function makeFilter(values: Partial<RangeFilter> = {}): FilterConfig {
    const base: RangeFilter = {
        min: 0,
        max: 100,
        currentMin: 10,
        currentMax: 90,
        mode: 'continuous',
        ranges: [
            {id: 'r1', label: 'Low', min: 0, max: 50, includeMin: true, includeMax: true},
            {id: 'r2', label: 'High', min: 50, max: 100, includeMin: false, includeMax: true},
        ],
        selectedRangeIds: ['r1'],
    }
    return {
        id: 'f1',
        displayName: 'Range Filter',
        column: 'col',
        columnIndex: 0,
        active: false,
        operator: 'between',
        values: {...base, ...values},
        type: 'range',
    }
}

describe('RangeFilterView', () => {
    const user = userEvent.setup()

    it('calls onChange with mode binned when toggling binned', async () => {
        const onChange = jest.fn()
        render(
            <RangeFilterView filter={makeFilter()} onChange={onChange} columnInfo={columnInfo}
                             filteredData={filteredData}/>,
        )
        const radios = screen.getAllByRole('radio')
        // [0] continuous, [1] binned
        await user.click(radios[1])
        expect(onChange).toHaveBeenCalled()
        const last = onChange.mock.calls.pop()?.[0]
        expect((last.values).mode).toBe('binned')
    })

    it('updates range values in continuous mode', async () => {
        const onChange = jest.fn()
        render(
            <RangeFilterView filter={makeFilter({mode: 'continuous'})} onChange={onChange} columnInfo={columnInfo}
                             filteredData={filteredData}/>,
        )
        const [minInput] = screen.getAllByRole('spinbutton')
        await user.click(minInput)
        await user.type(minInput, '5')
        // Called with operator between
        expect(onChange).toHaveBeenCalled()
        const last = onChange.mock.calls.pop()?.[0]
        expect(last).toHaveProperty('operator', 'between')
        expect(typeof (last.values).currentMin).toBe('number')
    })

    it('toggles bin selection in binned mode', async () => {
        const onChange = jest.fn()
        render(
            <RangeFilterView filter={makeFilter({mode: 'binned'})} onChange={onChange} columnInfo={columnInfo}
                             filteredData={filteredData}/>,
        )
        // Find first bin checkbox and toggle
        const checkboxes = screen.getAllByRole('checkbox')
        await user.click(checkboxes[0])
        const last = onChange.mock.calls.pop()?.[0]
        expect(last).toHaveProperty('operator', 'equals')
        expect(Array.isArray((last.values).selectedRangeIds)).toBe(true)
    })
})
