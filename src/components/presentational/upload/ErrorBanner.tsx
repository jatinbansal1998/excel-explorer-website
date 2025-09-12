import React from 'react'
import {ExclamationTriangleIcon} from '@heroicons/react/24/outline'

interface ErrorBannerProps {
    error: string | null | undefined
}

export function ErrorBanner({error}: Readonly<ErrorBannerProps>) {
    if (!error) return null
    return (
        <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0"/>
            <p className="text-sm">{error}</p>
        </div>
    )
}

