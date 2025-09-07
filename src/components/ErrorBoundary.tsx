import React, { Component, ErrorInfo, PropsWithChildren } from 'react'
import { Button } from './ui/Button'
import { ErrorHandler, ErrorType } from '@/utils/errorHandling'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // Enhanced error logging
    console.error('🚨 React Error Boundary caught error:', {
      error: error,
      errorMessage: error.message,
      errorStack: error.stack,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Log error to error handler
    ErrorHandler.getInstance().createError(
      ErrorType.BROWSER_ERROR,
      'React Error Boundary caught an error',
      error,
      { errorInfo },
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>

            <h2 className="mt-4 text-xl font-semibold text-center text-gray-900">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-gray-600 text-center">
              An unexpected error occurred. Please refresh the page and try again.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Reload
              </Button>

              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full"
              >
                Try Again
              </Button>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Technical Details
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error?.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple icon component to avoid external dependencies
function ExclamationTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  )
}
