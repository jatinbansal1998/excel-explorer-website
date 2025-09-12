'use client'

import React from 'react'
import PassphraseModalView from '@/components/presentational/openrouter/PassphraseModalView'
import {usePassphraseModal} from '@/hooks/usePassphraseModal'

interface PassphraseModalProps {
  isOpen: boolean
  onSubmit: (passphrase: string) => Promise<void> | void
  onClose: () => void
  error?: string | null
  busy?: boolean
}

export function PassphraseModal({ isOpen, onSubmit, onClose, error, busy }: PassphraseModalProps) {
    const vm = usePassphraseModal({busy, onSubmit})

  return (
      <PassphraseModalView
          isOpen={isOpen}
          onClose={onClose}
          error={error}
          busy={busy}
          passphrase={vm.passphrase}
          showPassphrase={vm.showPassphrase}
          onPassphraseChange={vm.setPassphrase}
          onToggleShowPassphrase={() => vm.setShowPassphrase(!vm.showPassphrase)}
          onSubmit={vm.handleSubmit}
      />
  )
}

export default PassphraseModal
