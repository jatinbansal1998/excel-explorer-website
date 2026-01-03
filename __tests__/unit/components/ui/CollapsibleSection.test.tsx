import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'

describe('CollapsibleSection', () => {
  const defaultProps = {
    title: 'Test Section',
    children: <div>Test Content</div>,
  }

  describe('Rendering', () => {
    test('renders section title', () => {
      render(<CollapsibleSection {...defaultProps} />)
      expect(screen.getByRole('heading', { name: 'Test Section' })).toBeInTheDocument()
    })

    test('renders children content when expanded', () => {
      render(<CollapsibleSection {...defaultProps} />)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('renders with section-container class', () => {
      render(<CollapsibleSection {...defaultProps} testId="test-section" />)
      const section = screen.getByTestId('test-section')
      expect(section).toHaveClass('section-container')
    })

    test('renders chevron icon', () => {
      render(<CollapsibleSection {...defaultProps} />)
      const button = screen.getByRole('button', { name: /Collapse Test Section/i })
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    test('renders badge when provided', () => {
      render(<CollapsibleSection {...defaultProps} badge={<span>5 items</span>} />)
      expect(screen.getByText('5 items')).toBeInTheDocument()
    })

    test('renders headerActions when provided', () => {
      render(<CollapsibleSection {...defaultProps} headerActions={<button>Action</button>} />)
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
    })

    test('renders headerActions when provided', () => {
      render(
        <CollapsibleSection
          {...defaultProps}
          headerActions={<button type="button">Action</button>}
        />,
      )
      // Get the Action button specifically (not the collapse toggle)
      const buttons = screen.getAllByRole('button')
      const actionButton = buttons.find((b) => b.textContent === 'Action')
      expect(actionButton).toBeInTheDocument()
    })
  })

  describe('Collapse Behavior', () => {
    test('starts expanded by default', () => {
      render(<CollapsibleSection {...defaultProps} />)
      const button = screen.getByRole('button', { name: /Collapse Test Section/i })
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Test Content')).toBeVisible()
    })

    test('starts collapsed when defaultCollapsed is true', () => {
      render(<CollapsibleSection {...defaultProps} defaultCollapsed />)
      const button = screen.getByRole('button', { name: /Expand Test Section/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    test('toggles collapse state when header is clicked', () => {
      render(<CollapsibleSection {...defaultProps} />)

      const button = screen.getByRole('button', { name: /Collapse Test Section/i })
      expect(button).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    test('calls onCollapseChange when toggled', () => {
      const onCollapseChange = jest.fn()
      render(<CollapsibleSection {...defaultProps} onCollapseChange={onCollapseChange} />)

      const button = screen.getByRole('button', { name: /Collapse Test Section/i })
      fireEvent.click(button)

      expect(onCollapseChange).toHaveBeenCalledWith(true)

      fireEvent.click(button)
      expect(onCollapseChange).toHaveBeenCalledWith(false)
    })

    test('chevron rotates when collapsed', () => {
      render(<CollapsibleSection {...defaultProps} />)

      const button = screen.getByRole('button', { name: /Collapse Test Section/i })
      const chevron = button.querySelector('svg')

      expect(chevron).toHaveClass('rotate-0')

      fireEvent.click(button)
      expect(chevron).toHaveClass('-rotate-90')
    })
  })

  describe('Accessibility', () => {
    test('has proper aria-expanded attribute', () => {
      render(<CollapsibleSection {...defaultProps} />)
      const button = screen.getByRole('button', { name: /Collapse Test Section/i })
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    test('has proper aria-label for expand action', () => {
      render(<CollapsibleSection {...defaultProps} defaultCollapsed />)
      expect(screen.getByRole('button', { name: 'Expand Test Section' })).toBeInTheDocument()
    })

    test('has proper aria-label for collapse action', () => {
      render(<CollapsibleSection {...defaultProps} />)
      expect(screen.getByRole('button', { name: 'Collapse Test Section' })).toBeInTheDocument()
    })

    test('is keyboard accessible', () => {
      render(<CollapsibleSection {...defaultProps} />)
      const button = screen.getByRole('button', { name: /Collapse Test Section/i })

      button.focus()
      expect(document.activeElement).toBe(button)

      // Click to toggle (keyDown doesn't trigger button click by default in jsdom)
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Styling', () => {
    test('applies custom className', () => {
      render(<CollapsibleSection {...defaultProps} className="custom-class" testId="section" />)
      expect(screen.getByTestId('section')).toHaveClass('custom-class')
    })

    test('applies custom headerClassName', () => {
      render(<CollapsibleSection {...defaultProps} headerClassName="custom-header" />)
      const header = document.querySelector('.custom-header')
      expect(header).toBeInTheDocument()
    })

    test('applies custom contentClassName', () => {
      render(<CollapsibleSection {...defaultProps} contentClassName="custom-content" />)
      const content = document.querySelector('.custom-content')
      expect(content).toBeInTheDocument()
    })

    test('header has proper background styling', () => {
      render(<CollapsibleSection {...defaultProps} />)
      const header = document.querySelector('.bg-gray-50')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Animation', () => {
    test('content has transition classes', () => {
      render(<CollapsibleSection {...defaultProps} />)
      const contentWrapper = document.querySelector('.transition-all')
      expect(contentWrapper).toBeInTheDocument()
      expect(contentWrapper).toHaveClass('duration-200', 'ease-in-out')
    })

    test('collapsed content has maxHeight of 0', () => {
      render(<CollapsibleSection {...defaultProps} defaultCollapsed />)
      const contentWrapper = document.querySelector('.transition-all')
      expect(contentWrapper).toHaveStyle({ maxHeight: '0' })
    })
  })

  describe('Edge Cases', () => {
    test('renders with empty title', () => {
      render(<CollapsibleSection title="" children={<div>Content</div>} />)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    test('renders with complex children', () => {
      render(
        <CollapsibleSection title="Complex">
          <div>
            <h4>Nested Title</h4>
            <p>Paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </CollapsibleSection>,
      )
      expect(screen.getByRole('heading', { name: /nested title/i })).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    test('renders with null badge', () => {
      render(<CollapsibleSection {...defaultProps} badge={null} />)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('renders with null headerActions', () => {
      render(<CollapsibleSection {...defaultProps} headerActions={null} />)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('handles rapid toggle clicks', async () => {
      const onCollapseChange = jest.fn()
      render(<CollapsibleSection {...defaultProps} onCollapseChange={onCollapseChange} />)

      const button = screen.getByRole('button', { name: /Collapse Test Section/i })

      fireEvent.click(button)
      fireEvent.click(button)
      fireEvent.click(button)

      await waitFor(() => {
        expect(onCollapseChange).toHaveBeenCalledTimes(3)
      })
    })
  })

  describe('Integration', () => {
    test('headerActions remain visible when collapsed', () => {
      render(
        <CollapsibleSection
          {...defaultProps}
          defaultCollapsed
          headerActions={<button>Action</button>}
        />,
      )
      expect(screen.getByRole('button', { name: /action/i })).toBeVisible()
    })

    test('badge remains visible when collapsed', () => {
      render(<CollapsibleSection {...defaultProps} defaultCollapsed badge={<span>Badge</span>} />)
      expect(screen.getByText('Badge')).toBeVisible()
    })
  })
})
