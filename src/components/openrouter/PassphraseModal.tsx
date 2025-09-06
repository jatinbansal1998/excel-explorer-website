'use client'

import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface PassphraseModalProps {
  isOpen: boolean
  onSubmit: (passphrase: string) => Promise<void> | void
  onClose: () => void
  error?: string | null
  busy?: boolean
}

export function PassphraseModal({ isOpen, onSubmit, onClose, error, busy }: PassphraseModalProps) {
  const [passphrase, setPassphrase] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passphrase && !busy) {
      onSubmit(passphrase)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Decrypt OpenRouter Key" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-gray-600">
          An encrypted OpenRouter API key was found. Enter your passphrase to decrypt and connect.
        </p>
        <label className="block">
          <span className="text-sm text-gray-700">Passphrase</span>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            placeholder="Enter passphrase"
            autoComplete="current-password"
          />
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

export default PassphraseModal
