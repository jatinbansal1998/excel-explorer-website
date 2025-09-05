import { useState, useCallback, useEffect } from 'react';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandling';

export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null);
  const [errors, setErrors] = useState<AppError[]>([]);

  const handleError = useCallback((
    error: Error | string, 
    type: ErrorType, 
    context?: Record<string, any>
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const originalError = typeof error === 'string' ? undefined : error;
    
    const appError = ErrorHandler.getInstance().createError(
      type, 
      errorMessage, 
      originalError, 
      context
    );
    
    setError(appError);
    setErrors(prev => [appError, ...prev].slice(0, 10)); // Keep last 10 errors
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setError(null);
    ErrorHandler.getInstance().clearErrors();
  }, []);

  const removeError = useCallback((errorToRemove: AppError) => {
    setErrors(prev => prev.filter(err => err !== errorToRemove));
    if (error === errorToRemove) {
      setError(null);
    }
  }, [error]);

  const getErrorMessage = useCallback((error: AppError): string => {
    return ErrorHandler.getInstance().getErrorMessage(error);
  }, []);

  // Auto-clear recoverable errors after some time
  useEffect(() => {
    if (error && error.recoverable) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return {
    error,
    errors,
    handleError,
    clearError,
    clearAllErrors,
    removeError,
    getErrorMessage,
    hasError: error !== null,
    hasErrors: errors.length > 0
  };
}

// Hook for handling async operations with error catching
export function useAsyncError() {
  const { handleError } = useErrorHandler();

  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    errorType: ErrorType = ErrorType.BROWSER_ERROR,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error as Error, errorType, context);
      return null;
    }
  }, [handleError]);

  return { executeAsync };
}

// Hook for handling file operation errors specifically
export function useFileErrorHandler() {
  const { handleError, ...rest } = useErrorHandler();

  const handleFileError = useCallback((
    error: Error | string,
    operation: 'read' | 'parse' | 'upload' | 'export',
    fileName?: string
  ) => {
    let errorType: ErrorType;
    let context: Record<string, any> = { operation };

    if (fileName) {
      context.fileName = fileName;
    }

    switch (operation) {
      case 'read':
        errorType = ErrorType.FILE_READ_ERROR;
        break;
      case 'parse':
        errorType = ErrorType.PARSE_ERROR;
        break;
      case 'upload':
        errorType = ErrorType.FILE_TYPE_ERROR;
        break;
      case 'export':
        errorType = ErrorType.FILE_READ_ERROR; // Reuse for export errors
        break;
      default:
        errorType = ErrorType.FILE_READ_ERROR;
    }

    handleError(error, errorType, context);
  }, [handleError]);

  return {
    ...rest,
    handleFileError,
    handleError
  };
}

// Hook for retry functionality
export function useRetryableError() {
  const { handleError, ...rest } = useErrorHandler();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    errorType: ErrorType = ErrorType.BROWSER_ERROR,
    retryDelay: number = 1000
  ): Promise<T | null> => {
    let attempts = 0;
    
    while (attempts <= maxRetries) {
      try {
        setIsRetrying(attempts > 0);
        const result = await operation();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        attempts++;
        setRetryCount(attempts);
        
        if (attempts > maxRetries) {
          handleError(
            error as Error, 
            errorType, 
            { attempts, maxRetries, operation: operation.name }
          );
          setIsRetrying(false);
          return null;
        }
        
        // Wait before retrying
        if (attempts <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        }
      }
    }
    
    setIsRetrying(false);
    return null;
  }, [handleError]);

  return {
    ...rest,
    executeWithRetry,
    retryCount,
    isRetrying
  };
}