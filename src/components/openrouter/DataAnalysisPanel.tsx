import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { useOpenRouter } from '@/hooks/useOpenRouter'
import { OpenRouterChatMessage } from '@/types/openrouter'

interface Props {
  datasetContext?: string
}

export function DataAnalysisPanel({ datasetContext }: Props) {
  const { state, sendChat } = useOpenRouter()
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<OpenRouterChatMessage[]>([])

  async function handleSend() {
    if (!state.selectedModelId || !prompt) return
    setBusy(true)
    try {
      const req = {
        model: state.selectedModelId,
        messages: [
          datasetContext ? { role: 'system' as const, content: datasetContext } : undefined,
          { role: 'user' as const, content: prompt },
        ].filter(Boolean) as OpenRouterChatMessage[],
      }
      const res = await sendChat(req)
      const choice = res.choices[0]
      if (choice?.message) {
        setMessages((prev) => [...prev, { role: 'user', content: prompt }, choice.message])
        setPrompt('')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section-container p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">AI Analysis</div>
        {state.selectedModelId &&
          (() => {
            const model = state.models.find((m) => m.id === state.selectedModelId)
            const label = model?.name || state.selectedModelId
            return (
              <span
                className="text-[11px] px-2 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200"
                title={state.selectedModelId}
              >
                {label}
              </span>
            )
          })()}
      </div>
      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask for insights, suggestions, or chart explanations..."
          className="w-full h-24 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm px-3 py-2"
        />
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Model:{' '}
            {(() => {
              if (!state.selectedModelId) return 'Not selected'
              const model = state.models.find((m) => m.id === state.selectedModelId)
              return model?.name || state.selectedModelId
            })()}
          </div>
          <Button onClick={handleSend} disabled={!state.selectedModelId || !prompt || busy}>
            Send
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={`inline-block px-3 py-2 rounded-md text-sm ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
