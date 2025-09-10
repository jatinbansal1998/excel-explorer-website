import React, { useCallback, useRef, useState } from 'react'
import { DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { clsx } from 'clsx'

interface FileUploaderProps {
  onFileSelect: (_file: File) => void
  isLoading?: boolean
  acceptedTypes?: string[]
  maxSize?: number // in bytes
  className?: string
  progress?: {
    stage: string
    message?: string
    percent?: number
    loaded?: number
    total?: number
  }
}

function validateFile(file: File, maxSize: number, acceptedTypes: string[]): string | null {
  // Check file size
  if (file.size > maxSize) {
    return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!acceptedTypes.includes(fileExtension)) {
    return `File type "${fileExtension}" is not supported. Please upload: ${acceptedTypes.join(', ')}`
  }

  return null
}

function formatProgressMessage(progress?: FileUploaderProps['progress']): string {
  if (!progress) return 'Processing your file...'

  switch (progress.stage) {
    case 'validating':
      return 'Validating file...'
    case 'reading':
      if (progress.percent !== undefined) {
        return `Reading file... ${Math.round(progress.percent)}%`
      }
      return 'Reading file...'
    case 'parsing_workbook':
      return 'Parsing workbook...'
    case 'extracting_headers':
      return 'Extracting headers...'
    case 'building_rows':
      if (progress.percent !== undefined) {
        return `Processing rows... ${Math.round(progress.percent)}%`
      }
      return 'Processing rows...'
    case 'analyzing_columns':
      return 'Analyzing columns...'
    case 'complete':
      return 'Processing complete!'
    default:
      return progress.message || 'Processing your file...'
  }
}

export function FileUploader({
  onFileSelect,
  isLoading = false,
  acceptedTypes = ['.xlsx', '.xls', '.csv', '.numbers'],
  maxSize = 50 * 1024 * 1024, // 50MB default
  className,
  progress,
}: Readonly<FileUploaderProps>) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    (_file: File) => {
      setError('')

      const validationError = validateFile(_file, maxSize, acceptedTypes)
      if (validationError) {
        setError(validationError)
        return
      }

      onFileSelect(_file)
    },
    [onFileSelect, maxSize, acceptedTypes],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    },
    [handleFileSelect],
  )

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          {
            'border-primary-300 bg-primary-50': isDragOver && !isLoading,
            'border-gray-300 hover:border-gray-400': !isDragOver && !isLoading,
            'border-gray-200 bg-gray-50': isLoading,
          },
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">{formatProgressMessage(progress)}</p>
              {progress?.percent !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress.percent, 100)}%` }}
                  />
                </div>
              )}
              {progress?.loaded !== undefined && progress?.total !== undefined && (
                <p className="text-xs text-gray-500">
                  {Math.round((progress.loaded / 1024 / 1024) * 100) / 100} MB /{' '}
                  {Math.round((progress.total / 1024 / 1024) * 100) / 100} MB
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <DocumentArrowUpIcon
              className={clsx('h-12 w-12', isDragOver ? 'text-primary-500' : 'text-gray-400')}
            />

            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragOver ? 'Drop your file here' : 'Upload Excel or CSV file'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop your file here, or click to browse
              </p>
            </div>

            <Button onClick={openFileDialog} variant="primary" size="lg">
              Choose File
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Supported formats: {acceptedTypes.join(', ')}</p>
              <p>Maximum size: {(maxSize / 1024 / 1024).toFixed(0)}MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
