import React from 'react'
import {render, screen} from '@testing-library/react'
import {LoadingSpinner} from '@/components/ui/LoadingSpinner'

// Local helpers to reduce duplication across tests
const spinnerSel = 'svg.animate-spin'
const progressBarSel = '.bg-gray-200.rounded-full.h-2'
const progressFillSel = '.bg-primary-600'

function getSpinner(): SVGElement | null {
  return document.querySelector(spinnerSel)
}

function getProgressBar(): HTMLElement | null {
  return document.querySelector(progressBarSel)
}

function getProgressFill(): HTMLElement | null {
  return document.querySelector(progressFillSel)
}

function expectProgressWidth(percent: string) {
  const fill = getProgressFill()
  expect(fill).toBeInTheDocument()
  expect(fill).toHaveStyle({width: percent})
}

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />)

      const spinner = getSpinner()
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin', 'h-6', 'w-6') // default size
      expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
      expect(spinner).toHaveAttribute('fill', 'none')
      expect(spinner).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('should render with different sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const

      sizes.forEach((size) => {
        const {unmount} = render(<LoadingSpinner size={size}/>)
        const spinner = getSpinner()

        expect(spinner).toBeInTheDocument()

        // Check specific size classes
        switch (size) {
          case 'sm':
            expect(spinner).toHaveClass('h-4', 'w-4')
            expect(spinner).not.toHaveClass('h-6', 'w-6', 'h-8', 'w-8')
            break
          case 'md':
            expect(spinner).toHaveClass('h-6', 'w-6')
            expect(spinner).not.toHaveClass('h-4', 'w-4', 'h-8', 'w-8')
            break
          case 'lg':
            expect(spinner).toHaveClass('h-8', 'w-8')
            expect(spinner).not.toHaveClass('h-4', 'w-4', 'h-6', 'w-6')
            break
        }

        unmount()
      })
    })

    it('should render with custom className', () => {
      render(<LoadingSpinner className="custom-spinner" />)
      const spinner = getSpinner()

      expect(spinner).toHaveClass('custom-spinner')
      expect(spinner).toHaveClass('animate-spin', 'h-6', 'w-6') // default classes
    })

    it('should render as SVG element', () => {
      render(<LoadingSpinner />)
      const spinner = getSpinner()

      expect(spinner).toBeTruthy()
      expect(spinner?.tagName).toBe('svg')
    })

    it('should render with proper SVG structure', () => {
      render(<LoadingSpinner />)
      const spinner = getSpinner()
      expect(spinner).toBeInTheDocument()

      // Check circle element
      const circle = spinner?.querySelector('circle')
      expect(circle).toBeInTheDocument()
      expect(circle).toHaveClass('opacity-25')
      expect(circle).toHaveAttribute('cx', '12')
      expect(circle).toHaveAttribute('cy', '12')
      expect(circle).toHaveAttribute('r', '10')
      expect(circle).toHaveAttribute('stroke', 'currentColor')
      expect(circle).toHaveAttribute('stroke-width', '4')

      // Check path element
      const path = spinner?.querySelector('path')
      expect(path).toBeInTheDocument()
      expect(path).toHaveClass('opacity-75')
      expect(path).toHaveAttribute('fill', 'currentColor')
      expect(path).toHaveAttribute(
        'd',
        'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
      )
    })

    it('should render with message', () => {
      render(<LoadingSpinner message="Loading data..." />)

      const spinner = getSpinner()
      const message = screen.getByRole('paragraph')

      expect(spinner).toBeInTheDocument()
      expect(message).toBeInTheDocument()
      expect(message).toHaveTextContent('Loading data...')
      expect(message).toHaveClass('text-sm', 'text-gray-600', 'text-center')
    })

    it('should render without message by default', () => {
      render(<LoadingSpinner />)

      const spinner = getSpinner()
      expect(spinner).toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('should render progress bar when showProgress is true and progress is provided', () => {
      render(<LoadingSpinner showProgress progress={50} />)

      const progressBar = getProgressBar()
      const progressFill = getProgressFill()

      expect(progressBar).toBeInTheDocument()
      expect(progressFill).toBeInTheDocument()
      expectProgressWidth('50%')
      expect(progressFill).toHaveClass(
        'bg-primary-600',
        'h-2',
        'rounded-full',
        'transition-all',
        'duration-300',
        'ease-out',
      )
    })

    it('should not render progress bar when showProgress is false', () => {
      render(<LoadingSpinner showProgress={false} progress={50} />)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('should not render progress bar when progress is undefined', () => {
      render(<LoadingSpinner showProgress progress={undefined} />)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })


    it('should render progress bar with custom message', () => {
      render(<LoadingSpinner showProgress progress={75} message="Processing..." />)

      const progressText = screen.getByText('Processing...')
      const percentageText = screen.getByText('75%')

      expect(progressText).toBeInTheDocument()
      expect(percentageText).toBeInTheDocument()
      // The progress message is inside a flex container, so the parent has the classes
      expect(progressText.parentElement).toHaveClass('text-sm', 'text-gray-600')
      expect(percentageText.parentElement).toHaveClass('text-sm', 'text-gray-600')
    })

    it('should render progress bar with default message when no custom message provided', () => {
      render(<LoadingSpinner showProgress progress={30} />)

      const progressText = screen.getByText('Loading...')
      const percentageText = screen.getByText('30%')

      expect(progressText).toBeInTheDocument()
      expect(percentageText).toBeInTheDocument()
    })

    it('should handle progress values at boundaries', () => {
      const { rerender } = render(<LoadingSpinner showProgress progress={0} />)

      let progressFill = getProgressFill()
      expect(progressFill).toHaveStyle({ width: '0%' })

      rerender(<LoadingSpinner showProgress progress={100} />)
      progressFill = getProgressFill()
      expect(progressFill).toHaveStyle({ width: '100%' })
    })

    it('should render progress bar with proper structure', () => {
      render(<LoadingSpinner showProgress progress={45} />)

      const progressBar = getProgressBar()
      const progressContainer = progressBar?.parentElement
      const progressTextContainer =
        progressContainer?.parentElement?.querySelector('.flex.justify-between')

      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveClass('w-full', 'bg-gray-200', 'rounded-full', 'h-2')

      if (progressTextContainer) {
        expect(progressTextContainer).toBeInTheDocument()
        expect(progressTextContainer).toHaveClass(
          'flex',
          'justify-between',
          'text-sm',
          'text-gray-600',
          'mb-1',
        )
      }
    })
  })

  describe('Message Display', () => {
    it('should show message when showProgress is false', () => {
      render(<LoadingSpinner message="Custom message" showProgress={false} />)

      const message = screen.getByRole('paragraph')
      expect(message).toBeInTheDocument()
      expect(message).toHaveTextContent('Custom message')
      expect(message).toHaveClass('text-sm', 'text-gray-600', 'text-center')
    })

    it('should not show separate message when showProgress is true (message shown in progress bar)', () => {
      render(<LoadingSpinner message="Custom message" showProgress progress={50} />)

      // Message should appear in progress bar, not as separate element
      const progressMessage = screen.getByText('Custom message')
      expect(progressMessage).toBeInTheDocument()
      expect(progressMessage.parentElement).toHaveClass(
        'flex',
        'justify-between',
        'text-sm',
        'text-gray-600',
        'mb-1',
      )

      // Should not have separate message element
      const separateMessages = screen.getAllByText('Custom message')
      expect(separateMessages).toHaveLength(1)
    })

    it('should handle empty message string', () => {
      render(<LoadingSpinner message="" />)

      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
      const spinner = getSpinner()
      expect(spinner).toBeInTheDocument()
    })

    it('should handle message with special characters', () => {
      render(<LoadingSpinner message="Loading émojis 🎉 & spëcial chars" />)

      const message = screen.getByRole('paragraph')
      expect(message).toBeInTheDocument()
      expect(message).toHaveTextContent('Loading émojis 🎉 & spëcial chars')
    })

    it('should handle long message text', () => {
      const longMessage =
        'This is a very long loading message that should wrap properly and maintain its styling characteristics throughout the entire loading component.'
      render(<LoadingSpinner message={longMessage} />)

      const message = screen.getByRole('paragraph')
      expect(message).toBeInTheDocument()
      expect(message).toHaveTextContent(longMessage)
      expect(message).toHaveClass('text-sm', 'text-gray-600', 'text-center')
    })
  })

  describe('Container Structure', () => {
    it('should render with proper flex container', () => {
      render(<LoadingSpinner />)

      const container = getSpinner()?.closest('div')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'space-y-2',
      )
    })

    it('should maintain proper spacing between spinner and message', () => {
      render(<LoadingSpinner message="Test message" />)

      const container = getSpinner()?.closest('div')
      expect(container).toHaveClass('space-y-2')

      const spinner = getSpinner()
      const message = screen.getByRole('paragraph')

      expect(spinner).toBeInTheDocument()
      expect(message).toBeInTheDocument()
    })

    it('should maintain proper spacing between spinner and progress bar', () => {
      render(<LoadingSpinner showProgress progress={50} />)

      const container = getSpinner()?.closest('div')
      expect(container).toHaveClass('space-y-2')

      const spinner = getSpinner()
      const progressBar = getProgressBar()

      expect(spinner).toBeInTheDocument()
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined className gracefully', () => {
      render(<LoadingSpinner className={undefined} />)
      const spinner = getSpinner()

      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin', 'h-6', 'w-6') // default classes still apply
    })


    it('should handle negative progress values', () => {
      render(<LoadingSpinner showProgress progress={-10} />)

      const progressFill = getProgressFill()
      expect(progressFill).toHaveStyle({ width: '-10%' })
    })

    it('should handle progress values over 100', () => {
      render(<LoadingSpinner showProgress progress={150} />)

      const progressFill = getProgressFill()
      expect(progressFill).toHaveStyle({ width: '150%' })
    })

    it('should handle decimal progress values', () => {
      render(<LoadingSpinner showProgress progress={67.5} />)

      const percentageText = screen.getByText('68%') // Should be rounded
      expect(percentageText).toBeInTheDocument()

      const progressFill = getProgressFill()
      expect(progressFill).toHaveStyle({ width: '67.5%' })
    })

    it('should render minimal spinner with no optional props', () => {
      render(<LoadingSpinner />)

      const spinner = getSpinner()
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin', 'h-6', 'w-6')

      expect(getProgressBar()).not.toBeInTheDocument()
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper img role for spinner', () => {
      render(<LoadingSpinner />)
      const spinner = getSpinner()
      expect(spinner).toBeInTheDocument()
    })

    it('should have proper progressbar role when progress is shown', () => {
      render(<LoadingSpinner showProgress progress={50} />)
      const progressBar = getProgressBar()
      expect(progressBar).toBeInTheDocument()
    })

    it('should be accessible with screen readers', () => {
      render(<LoadingSpinner showProgress progress={75} message="Accessible loading message" />)

      const spinner = getSpinner()
      const progressBar = getProgressBar()
      const message = screen.getByText('Accessible loading message')
      const percentage = screen.getByText('75%')

      expect(spinner).toBeInTheDocument()
      expect(progressBar).toBeInTheDocument()
      expect(message).toBeInTheDocument()
      expect(percentage).toBeInTheDocument()
    })

    it('should maintain proper ARIA attributes', () => {
      render(<LoadingSpinner showProgress progress={50} />)

      const progressBar = getProgressBar()
      // Progress bar should have proper aria attributes for accessibility
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Animation and Styling', () => {
    it('should have proper animation classes', () => {
      render(<LoadingSpinner />)
      const spinner = getSpinner()

      expect(spinner).toHaveClass('animate-spin')
    })

    it('should have proper opacity classes for SVG elements', () => {
      render(<LoadingSpinner />)
      const spinner = getSpinner()
      expect(spinner).toBeInTheDocument()

      const circle = spinner?.querySelector('circle')
      const path = spinner?.querySelector('path')

      expect(circle).toHaveClass('opacity-25')
      expect(path).toHaveClass('opacity-75')
    })

    it('should have proper transition classes for progress bar', () => {
      render(<LoadingSpinner showProgress progress={50} />)
      const progressFill = getProgressFill()

      expect(progressFill).toHaveClass('transition-all', 'duration-300', 'ease-out')
    })

    it('should combine classes correctly with custom className', () => {
      render(<LoadingSpinner className="custom-class another-class" size="lg" />)
      const spinner = getSpinner()

      expect(spinner).toHaveClass('custom-class', 'another-class')
      expect(spinner).toHaveClass('animate-spin', 'h-8', 'w-8') // default and size classes
    })
  })
})
