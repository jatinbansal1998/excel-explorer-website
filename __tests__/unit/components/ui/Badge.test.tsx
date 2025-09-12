import React from 'react'
import {render, screen} from '@testing-library/react'
import {Badge} from '@/components/ui/Badge'

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Badge>Default Badge</Badge>)
      const badge = screen.getByText('Default Badge')

      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'px-2.5',
        'py-0.5',
        'rounded-full',
        'text-xs',
        'font-medium',
      )
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800') // default variant
    })

    it('should render with different variants', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline'] as const

      variants.forEach((variant) => {
        const { container, unmount } = render(<Badge variant={variant}>{variant} Badge</Badge>)
        const badge = screen.getByText(`${variant} Badge`)

        expect(badge).toBeInTheDocument()

        // Check specific variant classes
        switch (variant) {
          case 'default':
            expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
            break
          case 'secondary':
            expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
            break
          case 'destructive':
            expect(badge).toHaveClass('bg-red-100', 'text-red-800')
            break
          case 'outline':
            expect(badge).toHaveClass('border', 'border-gray-200', 'text-gray-700', 'bg-white')
            break
        }

        unmount()
      })
    })

    it('should render with custom className', () => {
      render(<Badge className="custom-badge">Custom Badge</Badge>)
      const badge = screen.getByText('Custom Badge')

      expect(badge).toHaveClass('custom-badge')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2.5', 'py-0.5') // base styles
    })

    it('should render with different children types', () => {
      // Test with string
      const { rerender } = render(<Badge>String Badge</Badge>)
      expect(screen.getByText('String Badge')).toBeInTheDocument()

      // Test with number
      rerender(<Badge>42</Badge>)
      expect(screen.getByText('42')).toBeInTheDocument()

      // Test with React element
      rerender(
        <Badge>
          <span>React Element Badge</span>
        </Badge>,
      )
      expect(screen.getByText('React Element Badge')).toBeInTheDocument()

      // Test with multiple children
      rerender(
        <Badge>
          <span>Multi</span> <span>Badge</span>
        </Badge>,
      )
      expect(screen.getByText('Multi')).toBeInTheDocument()
      expect(screen.getByText('Badge')).toBeInTheDocument()
    })
  })

  describe('Styling and Structure', () => {
    it('should render as span element', () => {
      render(<Badge>Span Badge</Badge>)
      const badge = screen.getByText('Span Badge')

      expect(badge.tagName).toBe('SPAN')
    })

    it('should combine classes correctly', () => {
      render(
        <Badge variant="destructive" className="extra-class">
          Combined Badge
        </Badge>,
      )
      const badge = screen.getByText('Combined Badge')

      expect(badge).toHaveClass('bg-red-100', 'text-red-800') // destructive variant
      expect(badge).toHaveClass('extra-class') // custom class
      expect(badge).toHaveClass('inline-flex', 'items-center') // base classes
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with different content', () => {
      render(
        <div>
          <Badge>Important</Badge>
          <Badge variant="secondary">Info</Badge>
          <Badge variant="destructive">Warning</Badge>
        </div>,
      )

      expect(screen.getByText('Important')).toBeInTheDocument()
      expect(screen.getByText('Info')).toBeInTheDocument()
      expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    it('should be accessible with screen readers', () => {
      render(<Badge>Important Notification</Badge>)
      const badge = screen.getByText('Important Notification')

      expect(badge).toBeInTheDocument()
      expect(badge.tagName).toBe('SPAN')
    })
  })

  describe('Edge Cases', () => {
    it('should render with empty string children', () => {
      const { container } = render(<Badge>{''}</Badge>)
      const badge = container.querySelector('span')

      expect(badge).toBeInTheDocument()
      expect(badge).toBeEmptyDOMElement()
    })

    it('should render with whitespace-only children', () => {
      const { container } = render(<Badge> </Badge>)
      const badge = container.querySelector('span')

      expect(badge).toBeInTheDocument()
      // HTML trims whitespace, so we expect empty content
      expect(badge).toHaveTextContent('')
    })

    it('should render with special characters', () => {
      render(<Badge>Badge with émojis 🎉 & spëcial chars</Badge>)
      const badge = screen.getByText('Badge with émojis 🎉 & spëcial chars')

      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Badge with émojis 🎉 & spëcial chars')
    })

    it('should render with long text', () => {
      const longText =
        'This is a very long badge text that should wrap properly and maintain its styling characteristics'
      render(<Badge>{longText}</Badge>)
      const badge = screen.getByText(longText)

      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'text-xs',
        'font-medium',
      )
    })

    it('should handle undefined className gracefully', () => {
      render(<Badge className={undefined}>Undefined Class Badge</Badge>)
      const badge = screen.getByText('Undefined Class Badge')

      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800') // default variant still applies
    })


  })

  describe('Variant Specific Behavior', () => {
    it('should apply outline variant styling correctly', () => {
      render(<Badge variant="outline">Outline Badge</Badge>)
      const badge = screen.getByText('Outline Badge')

      expect(badge).toHaveClass('border', 'border-gray-200', 'text-gray-700', 'bg-white')
      expect(badge).not.toHaveClass('bg-blue-100') // should not have default background
    })

    it('should apply destructive variant styling correctly', () => {
      render(<Badge variant="destructive">Destructive Badge</Badge>)
      const badge = screen.getByText('Destructive Badge')

      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
      expect(badge).not.toHaveClass('bg-blue-100') // should not have default background
    })

    it('should apply secondary variant styling correctly', () => {
      render(<Badge variant="secondary">Secondary Badge</Badge>)
      const badge = screen.getByText('Secondary Badge')

      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
      expect(badge).not.toHaveClass('bg-blue-100') // should not have default background
    })


  })
})
