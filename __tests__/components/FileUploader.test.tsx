import React from 'react'
import {render, screen} from '@testing-library/react'
import {FileUploader} from '@/components/FileUploader'

describe('FileUploader layout', () => {
    it('expands to full width', () => {
        const onFileSelect = jest.fn()
        render(<FileUploader onFileSelect={onFileSelect}/>)

        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('w-full')
    })
})
