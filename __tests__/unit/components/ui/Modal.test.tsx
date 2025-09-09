import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { Modal } from '@/components/ui/Modal'

// Mock @heroicons/react/24/outline
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
}))

// Mock @headlessui/react to avoid Transition issues in tests
jest.mock('@headlessui/react', () => {
  // Mock Dialog sub-components
  const MockDialogTitle = ({ children, className, as: As = 'h3', ...props }: any) => (
    <As className={className} {...props}>
      {children}
    </As>
  )

  const MockDialogPanel = ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  )

  // Mock that respects the show prop for the main Transition
  const MockTransition = ({ children, show, ...props }: any) => {
    if (!show) return null
    return <>{children}</>
  }

  // Mock for Transition.Child - always render children (the show logic is handled by the parent)
  const MockTransitionChild = ({ children, ...props }: any) => <>{children}</>
  MockTransitionChild.displayName = 'MockTransitionChild'

  // Add Child property to MockTransition
  MockTransition.Child = MockTransitionChild

  return {
    ...jest.requireActual('@headlessui/react'),
    Transition: MockTransition,
    Dialog: Object.assign(
      ({ children, onClose, as: As = 'div', className, ...props }: any) => (
        <As
          role="dialog"
          aria-modal="true"
          className={className}
          onClick={(e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
              onClose()
            }
          }}
          {...props}
        >
          {children}
        </As>
      ),
      {
        Title: MockDialogTitle,
        Panel: MockDialogPanel,
      },
    ),
  }

  return {
    ...jest.requireActual('@headlessui/react'),
    Transition: MockTransition,
    Dialog: Object.assign(
      ({ children, onClose, as: As = 'div', className, ...props }: any) => (
        <As
          role="dialog"
          aria-modal="true"
          className={className}
          onClick={(e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
              onClose()
            }
          }}
          {...props}
        >
          {children}
        </As>
      ),
      {
        Title: MockDialogTitle,
        Panel: MockDialogPanel,
      },
    ),
    Fragment: React.Fragment,
  }
})

describe('Modal Component', () => {
  const mockOnClose = jest.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  }

  beforeEach(() => {
    mockOnClose.mockClear()
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders modal when isOpen is true', () => {
      render(<Modal {...defaultProps} />)

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    test('does not render modal when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)

      const modal = screen.queryByRole('dialog')
      expect(modal).not.toBeInTheDocument()
    })

    test('renders modal title', () => {
      render(<Modal {...defaultProps} />)

      const title = screen.getByRole('heading', { name: 'Test Modal' })
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-lg', 'font-medium', 'leading-6', 'text-gray-900')
    })

    test('renders modal content', () => {
      render(<Modal {...defaultProps} />)

      const content = screen.getByText('Modal Content')
      expect(content).toBeInTheDocument()
    })

    test('renders close button', () => {
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveClass('rounded-md', 'text-gray-400', 'hover:text-gray-600')
    })

    test('renders XMarkIcon in close button', () => {
      render(<Modal {...defaultProps} />)

      const icon = screen.getByTestId('x-mark-icon')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    test('applies small size classes when size is "sm"', () => {
      render(<Modal {...defaultProps} size="sm" />)

      const modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass('max-w-md')
    })

    test('applies medium size classes when size is "md" (default)', () => {
      render(<Modal {...defaultProps} />)

      const modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass('max-w-lg')
    })

    test('applies large size classes when size is "lg"', () => {
      render(<Modal {...defaultProps} size="lg" />)

      const modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass('max-w-2xl')
    })

    test('applies extra large size classes when size is "xl"', () => {
      render(<Modal {...defaultProps} size="xl" />)

      const modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass('max-w-4xl')
    })
  })

  describe('Styling and Classes', () => {
    test('applies correct modal panel classes', () => {
      render(<Modal {...defaultProps} />)

      const modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass(
        'w-full',
        'max-w-lg',
        'transform',
        'overflow-hidden',
        'rounded-xl',
        'bg-white',
        'p-4',
        'text-left',
        'align-middle',
        'shadow-md',
        'transition-all',
        'section-container',
      )
    })

    test('applies correct header container classes', () => {
      render(<Modal {...defaultProps} />)

      const headerContainer = document.querySelector('.flex.items-center.justify-between.mb-4')
      expect(headerContainer).toBeInTheDocument()
      expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between', 'mb-4')
    })

    test('applies correct content container classes', () => {
      render(<Modal {...defaultProps} />)

      const contentContainer = document.querySelector('.max-h-\\[70vh\\].overflow-y-auto.pr-1')
      expect(contentContainer).toBeInTheDocument()
      expect(contentContainer).toHaveClass('max-h-[70vh]', 'overflow-y-auto', 'pr-1')
    })
  })

  describe('Interactions', () => {
    test('calls onClose when close button is clicked', () => {
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onClose when dialog background is clicked', () => {
      render(<Modal {...defaultProps} />)

      const modal = screen.getByRole('dialog')
      fireEvent.click(modal)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('does not call onClose when content area is clicked', () => {
      render(<Modal {...defaultProps} />)

      const content = screen.getByText('Modal Content')
      fireEvent.click(content)

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('close button has correct focus styles', () => {
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500',
        'focus:ring-offset-2',
      )
    })
  })

  describe('Accessibility', () => {
    test('modal has correct ARIA attributes', () => {
      render(<Modal {...defaultProps} />)

      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
    })

    test('close button has screen reader text', () => {
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      const srText = closeButton.querySelector('.sr-only')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveTextContent('Close')
    })

    test('title is properly associated with modal', () => {
      render(<Modal {...defaultProps} />)

      const title = screen.getByRole('heading', { name: 'Test Modal' })
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-lg', 'font-medium', 'leading-6', 'text-gray-900')
    })
  })

  describe('Edge Cases', () => {
    test('renders with empty title', () => {
      render(<Modal {...defaultProps} title="" />)

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()

      const title = screen.getByRole('heading', { name: '' })
      expect(title).toBeInTheDocument()
    })

    test('renders with null children', () => {
      render(<Modal {...defaultProps}>{null}</Modal>)

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()

      const contentContainer = document.querySelector('.max-h-\\[70vh\\].overflow-y-auto.pr-1')
      expect(contentContainer).toBeInTheDocument()
      expect(contentContainer).toBeEmptyDOMElement()
    })

    test('renders with undefined children', () => {
      render(<Modal {...defaultProps}>{undefined}</Modal>)

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()

      const contentContainer = document.querySelector('.max-h-\\[70vh\\].overflow-y-auto.pr-1')
      expect(contentContainer).toBeInTheDocument()
      expect(contentContainer).toBeEmptyDOMElement()
    })

    test('renders with complex children content', () => {
      const complexContent = (
        <div>
          <h4>Section Title</h4>
          <p>Paragraph content</p>
          <button>Action Button</button>
        </div>
      )

      render(<Modal {...defaultProps}>{complexContent}</Modal>)

      expect(screen.getByRole('heading', { name: 'Section Title' })).toBeInTheDocument()
      expect(screen.getByRole('paragraph')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
    })

    test('renders with special characters in title', () => {
      render(<Modal {...defaultProps} title="Modal with Special Characters: áéíóú @#$%" />)

      const title = screen.getByRole('heading', {
        name: 'Modal with Special Characters: áéíóú @#$%',
      })
      expect(title).toBeInTheDocument()
    })

    test('renders with long title text', () => {
      const longTitle =
        'This is a very long modal title that should wrap properly and not break the layout or cause any overflow issues'
      render(<Modal {...defaultProps} title={longTitle} />)

      const title = screen.getByRole('heading', { name: longTitle })
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-lg', 'font-medium', 'leading-6', 'text-gray-900')
    })

    test('renders with HTML content in children', () => {
      const htmlContent = (
        <div>
          <strong>Bold text</strong>
          <em>Italic text</em>
          <a href="#">Link</a>
        </div>
      )

      render(<Modal {...defaultProps}>{htmlContent}</Modal>)

      expect(screen.getByRole('strong')).toBeInTheDocument()
      expect(screen.getByRole('emphasis')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    test('accepts and uses custom onClose function', () => {
      const customOnClose = jest.fn()
      render(<Modal {...defaultProps} onClose={customOnClose} />)

      const closeButton = screen.getByRole('button', { name: 'Close' })
      fireEvent.click(closeButton)

      expect(customOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    test('accepts and uses custom title', () => {
      render(<Modal {...defaultProps} title="Custom Title" />)

      const title = screen.getByRole('heading', { name: 'Custom Title' })
      expect(title).toBeInTheDocument()
    })

    test('accepts and uses custom children', () => {
      const customChildren = <div data-testid="custom-content">Custom Content</div>
      render(<Modal {...defaultProps}>{customChildren}</Modal>)

      const customContent = screen.getByText(/custom content/i)
      expect(customContent).toBeInTheDocument()
      expect(customContent).toHaveTextContent('Custom Content')
    })

    test('accepts and uses custom size', () => {
      render(<Modal {...defaultProps} size="xl" />)

      const modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass('max-w-4xl')
    })

    test('uses default size when not specified', () => {
      const { rerender } = render(<Modal {...defaultProps} />)

      let modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass('max-w-lg')

      rerender(<Modal {...defaultProps} size={undefined} />)
      modalPanel = document.querySelector('.section-container')
      expect(modalPanel).toHaveClass('max-w-lg')
    })
  })

  describe('Component Structure', () => {
    test('has correct DOM structure', () => {
      render(<Modal {...defaultProps} />)

      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()

      const title = screen.getByRole('heading', { name: 'Test Modal' })
      expect(title).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toBeInTheDocument()

      const content = screen.getByText('Modal Content')
      expect(content).toBeInTheDocument()
    })

    test('header section contains title and close button', () => {
      render(<Modal {...defaultProps} />)

      const headerContainer = document.querySelector('.flex.items-center.justify-between.mb-4')
      expect(headerContainer).toBeInTheDocument()

      const title = screen.getByRole('heading', { name: 'Test Modal' })
      const closeButton = screen.getByRole('button', { name: 'Close' })

      expect(headerContainer).toContainElement(title)
      expect(headerContainer).toContainElement(closeButton)
    })

    test('content section contains children', () => {
      render(<Modal {...defaultProps} />)

      const contentContainer = document.querySelector('.max-h-\\[70vh\\].overflow-y-auto.pr-1')
      expect(contentContainer).toBeInTheDocument()

      const content = screen.getByText('Modal Content')
      expect(contentContainer).toContainElement(content)
    })
  })
})
