'use client'

import {useCallback, useState} from 'react'

export interface UsePassphraseModalOptions {
    busy?: boolean
    onSubmit: (passphrase: string) => Promise<void> | void
}

export function usePassphraseModal({busy, onSubmit}: UsePassphraseModalOptions) {
    const [passphrase, setPassphrase] = useState('')
    const [showPassphrase, setShowPassphrase] = useState(false)

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            if (passphrase && busy !== true) {
                onSubmit(passphrase)
            }
        },
        [passphrase, busy, onSubmit],
    )

    return {
        passphrase,
        setPassphrase,
        showPassphrase,
        setShowPassphrase,
        handleSubmit,
    }
}

export type UsePassphraseModalReturn = ReturnType<typeof usePassphraseModal>

