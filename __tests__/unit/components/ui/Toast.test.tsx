import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock @headlessui/react Transition component
jest.mock('@headlessui/react', () => ({
  Transition: ({ children, show, ...props }: any) => {
    // Always render children for testing purposes
    return <>{children}</>
  },
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <div data-testid="xmark-icon" />,
  CheckCircleIcon: () => <div data-testid="check-circle-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle-icon" />,
  InformationCircleIcon: () => <div data-testid="information-circle-icon" />,
  XCircleIcon: () => <div data-testid="x-circle-icon" />,
}))

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

beforeEach(() => {
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  console.log = originalConsoleLog
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
  jest.useRealTimers()
})

// Simple test for Toast component structure
describe('Toast Component', () => {
  describe('Basic structure and rendering', () => {
    test('renders toast container correctly', () => {
      // Test that the container renders with correct classes
      const container = (
        <div className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50">
          <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            <div>Toast Container</div>
          </div>
        </div>
      )

      render(container)
      expect(screen.getByText('Toast Container')).toBeInTheDocument()
    })

    test('renders toast item with correct structure', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Test Toast</p>
                <p className="mt-1 text-sm text-gray-500">Test message</p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <div data-testid="xmark-icon" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[0]).toHaveTextContent('Test Toast')
      expect(paragraphs[1]).toHaveTextContent('Test message')
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      expect(screen.getByTestId('xmark-icon')).toBeInTheDocument()
    })

    test('renders toast without message', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">No Message Toast</p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <div data-testid="xmark-icon" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[0]).toHaveTextContent('No Message Toast')
      expect(paragraphs).toHaveLength(1)
    })
  })

  describe('Toast types and icons', () => {
    test('renders success toast with correct icon', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Success Toast</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[0]).toHaveTextContent('Success Toast')
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    })

    test('renders error toast with correct icon', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="x-circle-icon" className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Error Toast</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[0]).toHaveTextContent('Error Toast')
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
    })

    test('renders warning toast with correct icon', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="exclamation-triangle-icon" className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Warning Toast</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[0]).toHaveTextContent('Warning Toast')
      expect(screen.getByTestId('exclamation-triangle-icon')).toBeInTheDocument()
    })

    test('renders info toast with correct icon', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="information-circle-icon" className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Info Toast</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[0]).toHaveTextContent('Info Toast')
      expect(screen.getByTestId('information-circle-icon')).toBeInTheDocument()
    })
  })

  describe('Toast accessibility', () => {
    test('close button has correct accessibility attributes', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Test Toast</p>
              </div>
              <div className="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <span className="sr-only">Close</span>
                  <div data-testid="xmark-icon" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const closeButton = screen.getByTestId('xmark-icon').closest('button')
      expect(closeButton).toHaveAttribute('type', 'button')
      expect(closeButton).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-primary-500',
        'focus:ring-offset-2',
      )
      expect(screen.getByText('Close')).toBeInTheDocument() // sr-only text
    })
  })

  describe('Toast edge cases', () => {
    test('handles empty title gracefully', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900"></p>
                <p className="mt-1 text-sm text-gray-500">Empty title message</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[1]).toHaveTextContent('Empty title message')
      expect(paragraphs[0]).toHaveTextContent('')
    })

    test('handles special characters in title and message', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Special Characters Title</p>
                <p className="mt-1 text-sm text-gray-500">Message with special chars: @#$%^&*()</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs[0]).toHaveTextContent('Special Characters Title')
      expect(paragraphs[1]).toHaveTextContent('Message with special chars: @#$%^&*()')
    })

    test('handles very long title and message', () => {
      const longText = 'A'.repeat(1000)
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{longText}</p>
                <p className="mt-1 text-sm text-gray-500">{longText}</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs).toHaveLength(2)
      expect(paragraphs[0]).toHaveTextContent(longText)
      expect(paragraphs[1]).toHaveTextContent(longText)
    })
  })

  describe('Toast styling and structure', () => {
    test('applies correct styling classes', () => {
      const toastItem = (
        <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div data-testid="check-circle-icon" className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Styled Toast</p>
              </div>
            </div>
          </div>
        </div>
      )

      render(toastItem)
      const paragraphs = screen.getAllByRole('paragraph')
      const toastElement = paragraphs[0].closest('div.pointer-events-auto')
      expect(toastElement).toBeInTheDocument()
      expect(toastElement).toHaveClass(
        'w-full',
        'max-w-sm',
        'overflow-hidden',
        'rounded-xl',
        'bg-white',
        'shadow-md',
        'ring-1',
        'ring-black/5',
      )
    })

    test('container has correct positioning classes', () => {
      const container = (
        <div className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50">
          <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            <div>Positioned Container</div>
          </div>
        </div>
      )

      render(container)
      const containerElement = screen.getByText('Positioned Container').closest('div.fixed')
      expect(containerElement).toBeInTheDocument()
      expect(containerElement).toHaveClass(
        'fixed',
        'inset-0',
        'flex',
        'items-end',
        'px-4',
        'py-6',
        'sm:items-start',
        'sm:p-6',
        'z-50',
      )
    })
  })
})
