import React from 'react'
import {clsx} from 'clsx'
import {DEFAULT_ALLOWED_EXTS, DEFAULT_MAX_SIZE_MB} from '@/utils/fileValidation'
import type {UploadProgress} from '@/types/upload'
import {useFileUploader} from '@/hooks/useFileUploader'
import {UploadProgress as UploadProgressView} from '@/components/presentational/upload/UploadProgress'
import {Dropzone} from '@/components/presentational/upload/Dropzone'
import {ErrorBanner} from '@/components/presentational/upload/ErrorBanner'

interface FileUploaderProps {
  onFileSelect: (_file: File) => void
  isLoading?: boolean
  acceptedTypes?: string[]
  maxSize?: number // in bytes
  className?: string
    progress?: UploadProgress
}

export function FileUploader({
  onFileSelect,
  isLoading = false,
  acceptedTypes = DEFAULT_ALLOWED_EXTS,
  maxSize = DEFAULT_MAX_SIZE_MB * 1024 * 1024, // 50MB default
  className,
  progress,
}: Readonly<FileUploaderProps>) {
    const {fileInputRef, isDragOver, error, handlers} = useFileUploader({
        onFileSelect,
        acceptedTypes,
        maxSize,
        isDisabled: isLoading,
    })

  return (
      <div className={clsx('w-full', className)}>
        <button
            type="button"
            data-testid="file-uploader"
        className={clsx(
            'relative w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          {
            'border-primary-300 bg-primary-50': isDragOver && !isLoading,
            'border-gray-300 hover:border-gray-400': !isDragOver && !isLoading,
            'border-gray-200 bg-gray-50': isLoading,
          },
        )}
            onDragOver={handlers.onDragOver}
            onDragLeave={handlers.onDragLeave}
            onDrop={handlers.onDrop}
            onClick={() => {
                if (!isLoading) handlers.openFileDialog()
            }}
            disabled={isLoading}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handlers.onInputChange}
          disabled={isLoading}
        />

        {isLoading ? (
            <UploadProgressView progress={progress}/>
        ) : (
            <Dropzone isDragOver={isDragOver} acceptedTypes={acceptedTypes} maxSizeBytes={maxSize}/>
        )}
        </button>

          <ErrorBanner error={error}/>
    </div>
  )
}
