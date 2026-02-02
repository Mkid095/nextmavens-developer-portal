/**
 * API Keys List Component
 *
 * Displays the list of API keys with copy functionality.
 */

'use client'

import { Key, Copy, Check } from 'lucide-react'
import { McpTokenBadge } from '@/components/McpTokenBadge'
import type { ApiKey } from '../types'

interface ApiKeysListProps {
  apiKeys: ApiKey[]
  copied: string | null
  onCopy: (text: string, id: string) => void
  onCreateClick: () => void
}

export function ApiKeysList({ apiKeys, copied, onCopy, onCreateClick }: ApiKeysListProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 text-sm bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create Key
        </button>
      </div>
      <div className="p-6 space-y-4">
        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-slate-900">{key.name}</div>
                    <McpTokenBadge apiKey={key as any} compact />
                  </div>
                  <code className="text-sm text-slate-600 block break-all">
                    {key.public_key && key.public_key.length > 20 ? key.public_key : `${key.public_key}•••• (incomplete)`}
                  </code>
                  {(!key.public_key || key.public_key.length <= 20) && (
                    <p className="text-xs text-amber-600 mt-1">Only prefix stored - recreate this key</p>
                  )}
                </div>
                <button
                  onClick={() => onCopy(key.public_key, key.id)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition ml-2"
                  title="Copy to clipboard"
                >
                  {copied === key.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
