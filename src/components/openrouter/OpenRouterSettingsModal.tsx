'use client'

import React from 'react'
import OpenRouterSettingsModalView from '@/components/presentational/openrouter/OpenRouterSettingsModalView'
import {useOpenRouterSettingsModal} from '@/hooks/useOpenRouterSettingsModal'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function OpenRouterSettingsModal({ isOpen, onClose }: Props) {
  const vm = useOpenRouterSettingsModal(isOpen)

  return (
      <OpenRouterSettingsModalView
          isOpen={isOpen}
          onClose={onClose}
          busy={vm.busy}
          error={vm.error}
          apiKeyInput={vm.apiKeyInput}
          keyName={vm.keyName}
          passphrase={vm.passphrase}
          confirmPassphrase={vm.confirmPassphrase}
          showApiKey={vm.showApiKey}
          showPassphrase={vm.showPassphrase}
          showConfirmPassphrase={vm.showConfirmPassphrase}
          onApiKeyInputChange={vm.setApiKeyInput}
          onKeyNameChange={vm.setKeyName}
          onPassphraseChange={vm.setPassphrase}
          onConfirmPassphraseChange={vm.setConfirmPassphrase}
          onToggleApiKeyVisibility={() => vm.setShowApiKey(!vm.showApiKey)}
          onTogglePassphraseVisibility={() => vm.setShowPassphrase(!vm.showPassphrase)}
          onToggleConfirmPassphraseVisibility={() =>
              vm.setShowConfirmPassphrase(!vm.showConfirmPassphrase)
          }
          onSaveEncrypted={vm.onSaveEncrypted}
          onUseWithoutSaving={vm.onUseWithoutSaving}
          namedKeyNames={vm.namedKeyNames}
          loadKeyName={vm.loadKeyName}
          loadPassphrase={vm.loadPassphrase}
          showLoadPassphrase={vm.showLoadPassphrase}
          onLoadKeyNameChange={vm.setLoadKeyName}
          onLoadPassphraseChange={vm.setLoadPassphrase}
          onToggleLoadPassphraseVisibility={() => vm.setShowLoadPassphrase(!vm.showLoadPassphrase)}
          onDeleteNamedKey={vm.onDeleteNamedKey}
          onLoadEncrypted={vm.onLoadEncrypted}
          isConnected={vm.isConnected}
          models={vm.models}
          filteredModels={vm.filteredModels}
          selectedModelId={vm.selectedModelId}
          searchQuery={vm.searchQuery}
          filter={vm.filter}
          onSearchQueryChange={vm.setSearchQuery}
          onFilterChange={vm.setFilter}
          onRefreshModels={vm.onRefreshModels}
          onSelectModel={vm.selectModel}
      />
  )
}
