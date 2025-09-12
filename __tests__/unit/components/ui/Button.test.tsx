import React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Button} from '@/components/ui/Button'
import {expectHasClasses} from '../../../utils/dom-helpers'

describe('Button Component', () => {
  const user = userEvent.setup()

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })

      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-primary-600', 'text-white', 'h-10', 'px-4', 'py-2')
    })

    it('should render with different variants', () => {
      const cases = {
            primary: ['bg-primary-600', 'text-white'],
            secondary: ['bg-gray-200', 'text-gray-900'],
            outline: ['border', 'border-gray-300', 'bg-transparent', 'text-gray-700'],
            primaryOutline: ['border', 'border-primary-600', 'bg-transparent', 'text-primary-700'],
            ghost: ['text-gray-700'],
          } as const

      ;(Object.keys(cases) as Array<keyof typeof cases>).forEach((variant) => {
        const {unmount} = render(<Button variant={variant}>Button</Button>)
        const button = screen.getByRole('button', { name: /button/i })
        expectHasClasses(button, [...cases[variant]])
        unmount()
      })
    })

    it('should render with different sizes', () => {
      const cases = {
            sm: ['h-8', 'px-3', 'text-sm'],
            md: ['h-10', 'px-4', 'py-2'],
            lg: ['h-12', 'px-8', 'text-lg'],
            icon: ['h-8', 'w-8', 'p-0'],
          } as const

      ;(Object.keys(cases) as Array<keyof typeof cases>).forEach((size) => {
        const {unmount} = render(<Button size={size}>Button</Button>)
        const button = screen.getByRole('button', { name: /button/i })
        expectHasClasses(button, [...cases[size]])
        unmount()
      })
    })

    it('should render with custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>)
      const button = screen.getByRole('button', { name: /custom button/i })

      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center') // base styles
    })

    it('should render children correctly', () => {
      render(
        <Button>
          <span>Child Content</span>
        </Button>,
      )

      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Loading Button</Button>)
      const button = screen.getByRole('button', { name: /loading button/i })

      expect(button).toBeDisabled()

      // Check for spinner SVG
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin', 'h-4', 'w-4')
    })

    it('should not show loading spinner when isLoading is false', () => {
      render(<Button isLoading={false}>Normal Button</Button>)
      const button = screen.getByRole('button', { name: /normal button/i })

      expect(button).not.toBeDisabled()

      // Check for absence of spinner
      const spinner = button.querySelector('svg')
      expect(spinner).not.toBeInTheDocument()
    })

    it('should disable button when loading', () => {
      render(<Button isLoading>Disabled Button</Button>)
      const button = screen.getByRole('button', { name: /disabled button/i })

      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button', { name: /disabled button/i })

      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    })


    it('should not be disabled by default', () => {
      render(<Button>Enabled Button</Button>)
      const button = screen.getByRole('button', { name: /enabled button/i })

      expect(button).not.toBeDisabled()
    })
  })

  describe('Interaction', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Clickable Button</Button>)

      const button = screen.getByRole('button', { name: /clickable button/i })
      await user.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick handler when disabled', async () => {
      const handleClick = jest.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>,
      )

      const button = screen.getByRole('button', { name: /disabled button/i })
      await user.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should not call onClick handler when loading', async () => {
      const handleClick = jest.fn()
      render(
        <Button onClick={handleClick} isLoading>
          Loading Button
        </Button>,
      )

      const button = screen.getByRole('button', { name: /loading button/i })
      await user.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should handle keyboard events', async () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Keyboard Button</Button>)

      const button = screen.getByRole('button', { name: /keyboard button/i })

      // Test Enter key
      await user.type(button, '{Enter}')
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Button>Accessible Button</Button>)
      const button = screen.getByRole('button', { name: /accessible button/i })

      expect(button).toBeInTheDocument()
    })

    it('should support aria-label', () => {
      render(<Button aria-label="Custom aria label">Button Text</Button>)
      const button = screen.getByRole('button', { name: /custom aria label/i })

      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-label', 'Custom aria label')
    })


    it('should support custom data attributes', () => {
      render(<Button data-testid="custom-button">Custom Button</Button>)
      const button = screen.getByRole('button', { name: /custom button/i })

      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Custom Button')
      expect(button).toHaveAttribute('data-testid', 'custom-button')
    })
  })

  describe('Focus and Visual States', () => {
    it('should have focus styles', () => {
      render(<Button>Focus Button</Button>)
      const button = screen.getByRole('button', { name: /focus button/i })

      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('should have hover styles', () => {
      render(<Button variant="primary">Hover Button</Button>)
      const button = screen.getByRole('button', { name: /hover button/i })

      expect(button).toHaveClass('hover:bg-primary-700')
    })

    it('should have transition styles', () => {
      render(<Button>Transition Button</Button>)
      const button = screen.getByRole('button', { name: /transition button/i })

      expect(button).toHaveClass('transition-colors')
    })
  })

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      render(<Button></Button>)
      const button = screen.getByRole('button')

      expect(button).toBeInTheDocument()
      expect(button).toBeEmptyDOMElement()
    })

    it('should render with complex children', () => {
      render(
        <Button>
          <div>
            <span>Nested Content</span>
          </div>
        </Button>,
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(screen.getByText('Nested Content')).toBeInTheDocument()
    })

    it('should spread additional props correctly', () => {
      render(
        <Button type="submit" form="test-form" title="Submit form" data-custom="custom-value">
          Submit
        </Button>,
      )

      const button = screen.getByRole('button', { name: /submit/i })

      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'test-form')
      expect(button).toHaveAttribute('title', 'Submit form')
      expect(button).toHaveAttribute('data-custom', 'custom-value')
    })
  })
})
