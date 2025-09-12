import React from 'react'
import {render, screen} from '@testing-library/react'
import {expectHasClasses, expectLacksClasses} from '../../../utils/dom-helpers'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from '@/components/ui/Card'

describe('Card Component System', () => {
  describe('Main Card Component', () => {
    it('should render with default props', () => {
      render(<Card>Default Card Content</Card>)
      const card = screen.getByText('Default Card Content')

      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'bg-white', 'p-4') // default padding
      expect(card).not.toHaveClass('border', 'shadow-md') // default variant
    })

    it('should render with different padding options', () => {
      const cases = {
            none: {has: [] as string[], not: ['p-2', 'p-4', 'p-6']},
            sm: {has: ['p-2'], not: ['p-4', 'p-6']},
            md: {has: ['p-4'], not: ['p-2', 'p-6']},
            lg: {has: ['p-6'], not: ['p-2', 'p-4']},
          } as const

      ;(Object.keys(cases) as Array<keyof typeof cases>).forEach((padding) => {
        const {unmount} = render(
          <Card padding={padding}>Card with {padding} padding</Card>,
        )
        const card = screen.getByText(`Card with ${padding} padding`)
        if (cases[padding].has.length) expectHasClasses(card, cases[padding].has as any)
        expectLacksClasses(card, cases[padding].not as any)
        unmount()
      })
    })

    it('should render with different variants', () => {
      const cases = {
            default: {has: [] as string[], not: ['border', 'shadow-md']},
            outlined: {has: ['border', 'border-gray-200'], not: ['shadow-md']},
            elevated: {has: ['shadow-md', 'border', 'border-gray-100'], not: [] as string[]},
          } as const

      ;(Object.keys(cases) as Array<keyof typeof cases>).forEach((variant) => {
        const {unmount} = render(<Card variant={variant}>{variant} Card</Card>)
        const card = screen.getByText(`${variant} Card`)
        if (cases[variant].has.length) expectHasClasses(card, cases[variant].has as any)
        if (cases[variant].not.length) expectLacksClasses(card, cases[variant].not as any)
        unmount()
      })
    })

    it('should render with custom className', () => {
      render(<Card className="custom-card">Custom Card</Card>)
      const card = screen.getByText('Custom Card')

      expect(card).toHaveClass('custom-card')
      expect(card).toHaveClass('rounded-lg', 'bg-white', 'p-4') // base styles
    })

    it('should combine padding, variant, and custom classes correctly', () => {
      render(
        <Card padding="lg" variant="elevated" className="combined-card">
          Combined Card
        </Card>,
      )
      const card = screen.getByText('Combined Card')

      expect(card).toHaveClass('p-6') // lg padding
      expect(card).toHaveClass('shadow-md', 'border', 'border-gray-100') // elevated variant
      expect(card).toHaveClass('combined-card') // custom class
      expect(card).toHaveClass('rounded-lg', 'bg-white') // base classes
    })

    it('should render as div element', () => {
      render(<Card>Div Card</Card>)
      const card = screen.getByText('Div Card')

      expect(card.tagName).toBe('DIV')
    })

    it('should render with different children types', () => {
      const { rerender } = render(<Card>String Content</Card>)
      expect(screen.getByText('String Content')).toBeInTheDocument()

      rerender(<Card>42</Card>)
      expect(screen.getByText('42')).toBeInTheDocument()

      rerender(
        <Card>
          <span>React Element</span>
        </Card>,
      )
      expect(screen.getByText('React Element')).toBeInTheDocument()

      rerender(
        <Card>
          <div>Multi</div>
          <div>Content</div>
        </Card>,
      )
      expect(screen.getByText('Multi')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render with empty children', () => {
      const { container } = render(<Card>{''}</Card>)
      const card = container.querySelector('div')

      expect(card).toBeInTheDocument()
      expect(card).toBeEmptyDOMElement()
    })
  })

  describe('CardHeader Component', () => {
    it('should render with default props', () => {
      render(
        <Card>
          <CardHeader>Header Content</CardHeader>
        </Card>,
      )
      const header = screen.getByText('Header Content')

      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('border-b', 'border-gray-200', 'pb-4', 'mb-4')
    })

    it('should render with custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header">Custom Header</CardHeader>
        </Card>,
      )
      const header = screen.getByText('Custom Header')

      expect(header).toHaveClass('custom-header')
      expect(header).toHaveClass('border-b', 'border-gray-200', 'pb-4', 'mb-4') // base styles
    })

    it('should render as div element', () => {
      render(
        <Card>
          <CardHeader>Div Header</CardHeader>
        </Card>,
      )
      const header = screen.getByText('Div Header')

      expect(header.tagName).toBe('DIV')
    })
  })

  describe('CardContent Component', () => {
    it('should render with default props', () => {
      render(
        <Card>
          <CardContent>Main Content</CardContent>
        </Card>,
      )
      const content = screen.getByText('Main Content')

      expect(content).toBeInTheDocument()
      expect(content.tagName).toBe('DIV')
    })

    it('should render with custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content">Custom Content</CardContent>
        </Card>,
      )
      const content = screen.getByText('Custom Content')

      expect(content).toHaveClass('custom-content')
    })

    it('should render without any default classes', () => {
      render(
        <Card>
          <CardContent>No Default Classes</CardContent>
        </Card>,
      )
      const content = screen.getByText('No Default Classes')

      expect(content).not.toHaveClass('border', 'padding', 'margin')
    })
  })

  describe('CardFooter Component', () => {
    it('should render with default props', () => {
      render(
        <Card>
          <CardFooter>Footer Content</CardFooter>
        </Card>,
      )
      const footer = screen.getByText('Footer Content')

      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('border-t', 'border-gray-200', 'pt-4', 'mt-4')
    })

    it('should render with custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer">Custom Footer</CardFooter>
        </Card>,
      )
      const footer = screen.getByText('Custom Footer')

      expect(footer).toHaveClass('custom-footer')
      expect(footer).toHaveClass('border-t', 'border-gray-200', 'pt-4', 'mt-4') // base styles
    })

    it('should render as div element', () => {
      render(
        <Card>
          <CardFooter>Div Footer</CardFooter>
        </Card>,
      )
      const footer = screen.getByText('Div Footer')

      expect(footer.tagName).toBe('DIV')
    })
  })

  describe('CardTitle Component', () => {
    it('should render with default props', () => {
      render(
        <Card>
          <CardTitle>Card Title</CardTitle>
        </Card>,
      )
      const title = screen.getByRole('heading', { name: /card title/i })

      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900')
      expect(title.tagName).toBe('H3')
    })

    it('should render with custom className', () => {
      render(
        <Card>
          <CardTitle className="custom-title">Custom Title</CardTitle>
        </Card>,
      )
      const title = screen.getByRole('heading', { name: /custom title/i })

      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900') // base styles
    })

    it('should render with different children types', () => {
      render(
        <Card>
          <CardTitle>
            <span>Span Title</span>
          </CardTitle>
        </Card>,
      )
      const title = screen.getByRole('heading', { name: /span title/i })

      expect(title).toBeInTheDocument()
      expect(title.tagName).toBe('H3')
    })
  })

  describe('CardDescription Component', () => {
    it('should render with default props', () => {
      render(
        <Card>
          <CardDescription>Card Description</CardDescription>
        </Card>,
      )
      const description = screen.getByRole('paragraph')

      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-gray-600')
      expect(description.tagName).toBe('P')
    })

    it('should render with custom className', () => {
      render(
        <Card>
          <CardDescription className="custom-description">Custom Description</CardDescription>
        </Card>,
      )
      const description = screen.getByRole('paragraph')

      expect(description).toHaveClass('custom-description')
      expect(description).toHaveClass('text-sm', 'text-gray-600') // base styles
    })

    it('should render with different children types', () => {
      render(
        <Card>
          <CardDescription>
            <em>Emphasized Description</em>
          </CardDescription>
        </Card>,
      )
      const description = screen.getByRole('paragraph')

      expect(description).toBeInTheDocument()
      expect(description.tagName).toBe('P')
      expect(description).toHaveTextContent('Emphasized Description')
    })
  })

  describe('Complete Card Structure', () => {
    it('should render a complete card with all sub-components', () => {
      const { container } = render(
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Complete Card Title</CardTitle>
            <CardDescription>This is a complete card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content area of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>,
      )

      // Check main card
      const card = container.querySelector('div')
      expect(card).toHaveClass(
        'rounded-lg',
        'bg-white',
        'p-6',
        'shadow-md',
        'border',
        'border-gray-100',
      )

      // Check title
      const title = screen.getByRole('heading', { name: /complete card title/i })
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900')
      expect(title.tagName).toBe('H3')

      // Check description
      const description = screen.getAllByRole('paragraph')[0]
      expect(description).toHaveTextContent('This is a complete card description')
      expect(description).toHaveClass('text-sm', 'text-gray-600')
      expect(description.tagName).toBe('P')

      // Check content
      const content = screen.getAllByRole('paragraph')[1]
      expect(content).toHaveTextContent('This is the main content area of the card.')
      expect(content.tagName).toBe('P')

      // Check footer button
      const button = screen.getByRole('button', { name: /action/i })
      expect(button).toBeInTheDocument()
    })

    it('should render nested cards properly', () => {
      const { container } = render(
        <Card className="outer-card">
          <CardHeader>
            <CardTitle>Outer Card</CardTitle>
          </CardHeader>
          <CardContent>
            <Card className="inner-card" variant="outlined" padding="sm">
              <CardContent>Inner Card Content</CardContent>
            </Card>
          </CardContent>
        </Card>,
      )

      // Check outer card
      const outerCard = container.querySelector('.outer-card')
      expect(outerCard).toHaveClass('rounded-lg', 'bg-white', 'p-4')

      // Check inner card
      const innerCard = container.querySelector('.inner-card')
      expect(innerCard).toHaveClass('rounded-lg', 'bg-white', 'p-2', 'border', 'border-gray-200')

      // Check title
      const title = screen.getByRole('heading', { name: /outer card/i })
      expect(title).toBeInTheDocument()

      // Check inner content
      const innerContent = screen.getByText('Inner Card Content')
      expect(innerContent).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined className gracefully', () => {
      render(<Card className={undefined}>Undefined Class Card</Card>)
      const card = screen.getByText('Undefined Class Card')

      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'bg-white', 'p-4') // default styles still apply
    })

    it('should render with special characters', () => {
      render(<Card>Card with émojis 🎉 & spëcial chars</Card>)
      const card = screen.getByText('Card with émojis 🎉 & spëcial chars')

      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Card with émojis 🎉 & spëcial chars')
    })

    it('should render with long content', () => {
      const longContent =
        'This is a very long card content that should wrap properly and maintain its styling characteristics throughout the entire card component.'
      render(<Card>{longContent}</Card>)
      const card = screen.getByText(longContent)

      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'bg-white', 'p-4')
    })

    it('should render card without any sub-components', () => {
      render(<Card>Simple Card</Card>)
      const card = screen.getByText('Simple Card')

      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-lg', 'bg-white', 'p-4')
    })

    it('should render card with only some sub-components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only</CardTitle>
          </CardHeader>
          <CardContent>Content Only</CardContent>
        </Card>,
      )

      expect(screen.getByRole('heading', { name: /title only/i })).toBeInTheDocument()
      expect(screen.getByText('Content Only')).toBeInTheDocument()
      expect(screen.queryByText('Footer')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with screen readers', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Title</CardTitle>
            <CardDescription>Accessible Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Accessible content for screen readers</p>
          </CardContent>
        </Card>,
      )

      const title = screen.getByRole('heading', { name: /accessible title/i })
      const description = screen.getAllByRole('paragraph')[0]
      const content = screen.getAllByRole('paragraph')[1]

      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(title.tagName).toBe('H3')
      expect(description.tagName).toBe('P')
      expect(content.tagName).toBe('P')
    })

    it('should maintain proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
          </CardHeader>
          <CardContent>
            <h4>Subheading</h4>
            <p>Content with proper heading hierarchy</p>
          </CardContent>
        </Card>,
      )

      const mainTitle = screen.getByRole('heading', { name: /main title/i })
      const subheading = screen.getByRole('heading', { name: /subheading/i })

      expect(mainTitle.tagName).toBe('H3')
      expect(subheading.tagName).toBe('H4')
    })
  })
})
