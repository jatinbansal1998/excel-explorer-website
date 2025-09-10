export enum ErrorType {
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_SIZE_ERROR = 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR = 'FILE_TYPE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  BROWSER_ERROR = 'BROWSER_ERROR',
  FILTER_ERROR = 'FILTER_ERROR',
  CHART_ERROR = 'CHART_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  timestamp: Date;
  context?: Record<string, unknown>;
  recoverable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!this.instance) {
      this.instance = new ErrorHandler();
    }
    return this.instance;
  }

  createError(
    type: ErrorType, 
    message: string, 
    originalError?: Error,
    context?: Record<string, unknown>
  ): AppError {
    const error: AppError = {
      type,
      message,
      originalError,
      timestamp: new Date(),
      context,
      recoverable: this.isRecoverable(type)
    };
    
    this.logError(error);
    this.errors.push(error);
    
    return error;
  }

  getErrorMessage(error: AppError): string {
    const userMessages = {
      [ErrorType.FILE_READ_ERROR]: 'Unable to read the selected file. Please try again.',
      [ErrorType.FILE_SIZE_ERROR]: 'File is too large. Please select a smaller file.',
      [ErrorType.FILE_TYPE_ERROR]: 'Unsupported file type. Please select an Excel or CSV file.',
      [ErrorType.PARSE_ERROR]: 'Unable to parse the file. Please check if it\'s a valid Excel file.',
      [ErrorType.MEMORY_ERROR]: 'Not enough memory to process this file. Try a smaller file.',
      [ErrorType.BROWSER_ERROR]: 'Browser compatibility issue detected.',
      [ErrorType.FILTER_ERROR]: 'Error applying filters. Filters have been reset.',
      [ErrorType.CHART_ERROR]: 'Unable to generate chart with current data.'
    };
    
    return userMessages[error.type] || 'An unexpected error occurred.';
  }

  private isRecoverable(type: ErrorType): boolean {
    return [
      ErrorType.FILTER_ERROR,
      ErrorType.CHART_ERROR
    ].includes(type);
  }

  private logError(error: AppError): void {
    console.error(`[${error.type}] ${error.message}`, error.originalError);
    
    // In production, send to error reporting service
    if (typeof window !== 'undefined' && (window as Record<string, unknown>).gtag) {
      ((window as Record<string, unknown>).gtag as (...args: unknown[]) => void)('event', 'exception', {
        description: `${error.type}: ${error.message}`,
        fatal: !error.recoverable
      });
    }
  }

  getRecentErrors(): AppError[] {
    return this.errors.slice(-10);
  }

  clearErrors(): void {
    this.errors = [];
  }
}