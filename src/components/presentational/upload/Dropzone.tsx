import React from 'react'
import {DocumentArrowUpIcon} from '@heroicons/react/24/outline'
import {clsx} from 'clsx'

interface DropzoneProps {
    isDragOver: boolean
    acceptedTypes: string[]
    maxSizeBytes: number
}

export function Dropzone({isDragOver, acceptedTypes, maxSizeBytes}: Readonly<DropzoneProps>) {
    return (
        <div className="flex flex-col items-center space-y-4">
            <DocumentArrowUpIcon className={clsx('h-12 w-12', isDragOver ? 'text-primary-500' : 'text-gray-400')}/>

            <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                    {isDragOver ? 'Drop your file here' : 'Upload Excel or CSV file'}
                </p>
                <p className="text-sm text-gray-500">Drag and drop your file here, or click to browse</p>
            </div>

            <span
                className="inline-flex items-center rounded-md bg-primary-600 px-5 py-2.5 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
        Choose File
      </span>

            <div className="text-xs text-gray-500 space-y-1">
                <p>Supported formats: {acceptedTypes.join(', ')}</p>
                <p>Maximum size: {(maxSizeBytes / 1024 / 1024).toFixed(0)}MB</p>
            </div>
        </div>
    )
}
