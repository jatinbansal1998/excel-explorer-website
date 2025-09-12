import React from 'react'
import {LoadingSpinner} from '@/components/ui/LoadingSpinner'
import type {UploadProgress} from '@/types/upload'
import {formatProgressMessage} from '@/utils/uploadProgress'

interface UploadProgressProps {
    progress?: UploadProgress
}

export function UploadProgress({progress}: Readonly<UploadProgressProps>) {
    return (
        <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg"/>
            <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">{formatProgressMessage(progress)}</p>
                {progress?.percent !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{width: `${Math.min(progress.percent, 100)}%`}}
                        />
                    </div>
                )}
                {progress?.loaded !== undefined && progress?.total !== undefined && (
                    <p className="text-xs text-gray-500">
                        {Math.round((progress.loaded / 1024 / 1024) * 100) / 100} MB
                        / {Math.round((progress.total / 1024 / 1024) * 100) / 100} MB
                    </p>
                )}
            </div>
        </div>
    )
}

