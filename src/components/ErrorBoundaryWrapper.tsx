import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (_error: Error, _errorInfo: React.ErrorInfo) => void
}

/**
 * A wrapper component that provides error boundary protection
 * with a customizable fallback UI and error handling
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError: _onError,
}: Readonly<ErrorBoundaryWrapperProps>) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>
}

/**
 * Higher-order component to add error boundary protection to any component
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  _fallback?: React.ReactNode,
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Specialized error boundary for async operations and data loading
 */
export class AsyncErrorBoundary extends React.Component<
  ErrorBoundaryWrapperProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    this.props.onError?.(_error, _errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Loading Error</h3>
                <p className="text-sm text-red-600">
                  Failed to load component. Please try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

/**
 * Error boundary specifically for chart components
 */
export function ChartErrorBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AsyncErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Error</h3>
          <p className="text-sm text-gray-600">
            Unable to render chart. This might be due to invalid data or configuration.
          </p>
        </div>
      }
    >
      {children}
    </AsyncErrorBoundary>
  )
}

/**
 * Error boundary for data processing operations
 */
export function DataProcessingErrorBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AsyncErrorBoundary
      fallback={
        <div className="p-6 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Data Processing Error</h3>
              <p className="text-sm text-yellow-700">
                An error occurred while processing your data. Please check your file format and try
                again.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </AsyncErrorBoundary>
  )
}
