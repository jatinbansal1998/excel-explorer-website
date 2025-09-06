'use client'

import React, { useState } from 'react'
import { SessionManagerModal } from './session/SessionManagerModal'
import { useSessionPersistence } from '../hooks/useSessionPersistence'
import { OpenRouterSettingsModal } from './openrouter/OpenRouterSettingsModal'

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSessionsOpen, setIsSessionsOpen] = useState(false)
  const session = useSessionPersistence({ enabled: true })
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full max-w-none px-2 py-1.5 xl:px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Excel Explorer</h1>
            <div className="hidden sm:block text-sm text-gray-500">
              Upload, explore, and visualize your Excel data
            </div>
          </div>

          <nav className="flex items-center space-x-6">
            <button
              onClick={() => setIsSessionsOpen(true)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Manage Sessions
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              OpenRouter
            </button>
            <a
              href="https://www.linkedin.com/in/bansal-jatin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </a>
          </nav>
        </div>
      </div>
      <OpenRouterSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SessionManagerModal
        isOpen={isSessionsOpen}
        onClose={() => setIsSessionsOpen(false)}
        sessions={session.sessions}
        onRestore={async (id) => {
          await session.restoreSession(id)
          setIsSessionsOpen(false)
        }}
        onDelete={async (id) => {
          await session.deleteSession(id)
        }}
        onClearAll={async () => {
          await session.clearAll()
          setIsSessionsOpen(false)
        }}
      />
    </header>
  )
}
