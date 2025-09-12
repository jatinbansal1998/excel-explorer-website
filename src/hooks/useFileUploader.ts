import {useCallback, useRef, useState} from 'react'
import {DEFAULT_ALLOWED_EXTS, DEFAULT_MAX_SIZE_MB, validateFile as validateFileUtil} from '@/utils/fileValidation'

interface UseFileUploaderOptions {
    onFileSelect: (_file: File) => void
    acceptedTypes?: string[]
    maxSize?: number // in bytes
    isDisabled?: boolean
}

export function useFileUploader({
                                    onFileSelect,
                                    acceptedTypes = DEFAULT_ALLOWED_EXTS,
                                    maxSize = DEFAULT_MAX_SIZE_MB * 1024 * 1024,
                                    isDisabled = false,
                                }: UseFileUploaderOptions) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [error, setError] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback(
        (_file: File) => {
            setError('')

            const result = validateFileUtil(_file, {
                maxSizeMB: maxSize / 1024 / 1024,
                allowedTypes: acceptedTypes,
            })
            if (!result.ok) {
                setError(result.errors[0] ?? 'Invalid file')
                return
            }

            onFileSelect(_file)
        },
        [onFileSelect, maxSize, acceptedTypes],
    )

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        if (isDisabled) return
        setIsDragOver(true)
    }, [isDisabled])

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            if (isDisabled) return
            setIsDragOver(false)

            const files = Array.from(e.dataTransfer.files)
            if (files.length > 0) {
                handleFileSelect(files[0])
            }
        },
        [handleFileSelect, isDisabled],
    )

    const onInputChange = useCallback(
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

    const openFileDialog = useCallback(() => {
        if (isDisabled) return
        fileInputRef.current?.click()
    }, [isDisabled])

    return {
        fileInputRef,
        isDragOver,
        error,
        setError,
        handlers: {
            onDragOver,
            onDragLeave,
            onDrop,
            onInputChange,
            openFileDialog,
        },
    }
}

