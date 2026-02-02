/**
 * API Keys Tab - New Key Display Component
 */

import { Check, Copy } from 'lucide-react'

interface NewKeyDisplayProps {
  newKey: {
    apiKey: {
      public_key: string
    }
    secretKey?: string
  }
  copied: string | null
  onCopy: (text: string, id: string) => void
  onCloseNewKey: () => void
  onOpenUsageExamples: () => void
}

export function NewKeyDisplay({ newKey, copied, onCopy, onCloseNewKey, onOpenUsageExamples }: NewKeyDisplayProps) {
  return (
    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-emerald-900">New API Key Created</h3>
          <p className="text-sm text-emerald-700">
            Copy these keys now. You won&apos;t see the secret key again.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUsageExamples}
            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
          >
            View Usage Examples
          </button>
          <button onClick={onCloseNewKey} className="text-emerald-600 hover:text-emerald-800">
            Close
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Public Key</label>
          <div className="flex gap-2">
            <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-slate-200 break-all">
              {newKey.apiKey.public_key}
            </code>
            <button
              onClick={() => onCopy(newKey.apiKey.public_key, 'new-public')}
              className="px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50"
            >
              {copied === 'new-public' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
        {newKey.secretKey && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key</label>
            <div className="flex gap-2">
              <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-slate-200 break-all">
                {newKey.secretKey}
              </code>
              <button
                onClick={() => onCopy(newKey.secretKey, 'new-secret')}
                className="px-3 py-2 bg-white border border-slate-200 rounded hover:bg-slate-50"
              >
                {copied === 'new-secret' ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
