/**
 * Success Step Component
 *
 * Step 5: Display created key and usage examples.
 */

'use client'

import { Check, Copy, AlertTriangle } from 'lucide-react'
import { getKeyPrefix } from '@/lib/types/api-key.types'
import type { ApiKeyType, ApiKeyEnvironment } from '@/lib/types/api-key.types'

interface UsageExample {
  title: string
  code: string
  language: string
}

interface SuccessStepProps {
  selectedKeyType: ApiKeyType
  environment: ApiKeyEnvironment
  mcpAccessLevel: 'ro' | 'rw' | 'admin'
  copied: string | null
  onCopy: (text: string, id: string) => void
  onCreateAnother: () => void
  onClose: () => void
}

export function SuccessStep({
  selectedKeyType,
  environment,
  mcpAccessLevel,
  copied,
  onCopy,
  onCreateAnother,
  onClose,
}: SuccessStepProps) {
  const generateUsageExamples = (): UsageExample[] => {
    const key = 'your-api-key-here' // Would be actual key in production

    return [
      {
        title: 'Environment Variable',
        code: `NEXTMAVENS_API_KEY=${key}`,
        language: 'bash',
      },
      {
        title: 'cURL Request',
        code: `curl -X GET "https://api.nextmavens.cloud/api/users" \\
  -H "X-API-Key: ${key}"`,
        language: 'bash',
      },
      {
        title: 'JavaScript (fetch)',
        code: `const response = await fetch('https://api.nextmavens.cloud/api/users', {
  headers: {
    'X-API-Key': '${key}'
  }
})

const data = await response.json()`,
        language: 'javascript',
      },
    ]
  }

  const examples = generateUsageExamples()
  const keyPrefix = getKeyPrefix(selectedKeyType, environment, mcpAccessLevel)

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-900 mb-2">API Key Created!</h3>
        <p className="text-slate-600">Your API key has been created successfully.</p>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Important: Save Your Key Now</h4>
            <p className="text-sm text-red-800">
              You will only see this key <strong>one time</strong>. Make sure to copy it and store it securely.
              You won't be able to retrieve it again after closing this modal.
            </p>
          </div>
        </div>
      </div>

      {/* Key Display (placeholder - would show actual key in production) */}
      <div className="bg-slate-900 rounded-xl p-4">
        <label className="block text-xs text-slate-400 mb-2">Your API Key</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-emerald-400 text-sm break-all">
            {keyPrefix}••••••••••••••••
          </code>
          <button
            onClick={() => onCopy('your-api-key-here', 'created-key')}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            {copied === 'created-key' ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Usage Examples */}
      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Quick Start Examples</h4>
        <div className="space-y-4">
          {examples.map((example, index) => (
            <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="font-medium text-slate-700 text-sm">{example.title}</span>
                <button
                  onClick={() => onCopy(example.code, `example-${index}`)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  {copied === `example-${index}` ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-900 p-4 overflow-x-auto">
                <code className="text-sm text-slate-300 font-mono">{example.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCreateAnother}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          Create Another Key
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-emerald-700 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
        >
          Done
        </button>
      </div>
    </div>
  )
}
