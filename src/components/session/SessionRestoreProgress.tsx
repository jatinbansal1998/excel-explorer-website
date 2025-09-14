'use client'

import React, { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface SessionRestoreProgressProps {
  isOpen: boolean
  progress: {
    stage:
      | 'validating'
      | 'loading-data'
      | 'loading-filters'
      | 'loading-charts'
      | 'applying'
      | 'complete'
    message: string
    progress: number
  } | null
  onCancel: () => void
}

const stageLabels = {
  validating: 'Validating Session',
  'loading-data': 'Loading Dataset',
  'loading-filters': 'Loading Filters',
  'loading-charts': 'Loading Charts',
  applying: 'Applying Data',
  complete: 'Complete!',
}

const stageDescriptions = {
  validating: 'Checking session integrity and availability',
  'loading-data': 'Loading your dataset with optimized performance',
  'loading-filters': 'Restoring your filter settings',
  'loading-charts': 'Loading your chart configurations',
  applying: 'Applying all data to the interface',
  complete: 'Restoration complete!',
}

const stageIcons = {
  validating: '🔍',
  'loading-data': '📊',
  'loading-filters': '🔽',
  'loading-charts': '📈',
  applying: '✨',
  complete: '✅',
}

export function SessionRestoreProgress({
  isOpen,
  progress,
  onCancel,
}: SessionRestoreProgressProps) {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('')

  useEffect(() => {
    if (isOpen && progress && progress.stage === 'validating' && !startTime) {
      setStartTime(Date.now())
    }
  }, [isOpen, progress, startTime])

  useEffect(() => {
    if (!startTime || !progress || progress.progress === 0) {
      setEstimatedTimeRemaining('')
      return
    }

    const elapsed = Date.now() - startTime
    const totalEstimated = elapsed / (progress.progress / 100)
    const remaining = totalEstimated - elapsed

    if (remaining > 0) {
      if (remaining < 1000) {
        setEstimatedTimeRemaining('Less than 1 second')
      } else if (remaining < 60000) {
        setEstimatedTimeRemaining(`${Math.ceil(remaining / 1000)} seconds`)
      } else {
        setEstimatedTimeRemaining(`${Math.ceil(remaining / 60000)} minutes`)
      }
    } else {
      setEstimatedTimeRemaining('')
    }
  }, [progress, startTime])

  if (!isOpen || !progress) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-4xl mb-2">{stageIcons[progress.stage]}</div>
            <h3 className="text-lg font-semibold text-gray-900">{stageLabels[progress.stage]}</h3>
            <p className="text-sm text-gray-600 mt-1">{stageDescriptions[progress.stage]}</p>
          </div>

          <div className="mb-6">
            <LoadingSpinner
              size="lg"
              progress={progress.progress}
              showProgress={true}
              message={progress.message}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Progress</span>
              <div className="text-right">
                <span>{Math.round(progress.progress)}%</span>
                {estimatedTimeRemaining && (
                  <span className="block text-xs text-gray-500">
                    ~{estimatedTimeRemaining} remaining
                  </span>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.progress}%` }}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Large datasets are loaded in optimized chunks for better
                performance.
              </p>
            </div>

            <p className="text-sm text-gray-500">{progress.message}</p>
          </div>

          {progress.stage !== 'complete' && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="text-xs text-gray-500 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Optimized for your device
              </div>
            </div>
          )}

          {progress.stage === 'complete' && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-green-600 font-medium">
                🎉 Session restored successfully!
              </p>
              <p className="text-xs text-gray-500">
                Your data has been loaded and is ready to use.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
