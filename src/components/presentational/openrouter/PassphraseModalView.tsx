'use client'

import React from 'react'
import {Modal} from '@/components/ui/Modal'
import {Button} from '@/components/ui/Button'
import {EyeIcon, EyeSlashIcon} from '@heroicons/react/24/outline'

interface Props {
    isOpen: boolean
    onClose: () => void
    error?: string | null
    busy?: boolean

    passphrase: string
    showPassphrase: boolean
    onPassphraseChange: (v: string) => void
    onToggleShowPassphrase: () => void
    onSubmit: (e: React.FormEvent) => void
}

export default function PassphraseModalView({
                                                isOpen,
                                                onClose,
                                                error,
                                                busy,
                                                passphrase,
                                                showPassphrase,
                                                onPassphraseChange,
                                                onToggleShowPassphrase,
                                                onSubmit,
                                            }: Readonly<Props>) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Decrypt OpenRouter Key" size="sm">
            <form onSubmit={onSubmit} className="space-y-3">
                <p className="text-sm text-gray-600">
                    An encrypted OpenRouter API key was found. Enter your passphrase to decrypt and connect.
                </p>
                <label className="block">
                    <span className="text-sm text-gray-700">Passphrase</span>
                    <div className="relative">
                        <input
                            type={showPassphrase ? 'text' : 'password'}
                            value={passphrase}
                            onChange={(e) => onPassphraseChange(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm pr-10"
                            placeholder="Enter passphrase"
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={onToggleShowPassphrase}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                            {showPassphrase ? (
                                <EyeSlashIcon className="h-4 w-4"/>
                            ) : (
                                <EyeIcon className="h-4 w-4"/>
                            )}
                        </button>
                    </div>
                </label>
                {error && <div className="text-sm text-red-600">{error}</div>}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={busy === true}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!passphrase || busy === true}>
                        {busy ? 'Connecting…' : 'Decrypt & Connect'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

