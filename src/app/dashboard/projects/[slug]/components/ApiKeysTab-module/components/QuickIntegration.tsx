/**
 * API Keys Tab - Quick Integration Component
 */

import { Check, Copy } from 'lucide-react'
import { INTEGRATION_CODE_EXAMPLE } from '../constants'

interface QuickIntegrationProps {
  project: { id: string }
  copied: string | null
  onCopy: (text: string, id: string) => void
}

export function QuickIntegration({ project, copied, onCopy }: QuickIntegrationProps) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
      <h3 className="font-semibold text-emerald-900 mb-3">Quick Integration</h3>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Using Fetch API</p>
          <div className="relative group">
            <button
              onClick={() =>
                onCopy(
                  INTEGRATION_CODE_EXAMPLE.replace('PROJECT_ID', project.id),
                  'sdk-integration'
                )
              }
              className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg opacity-0 group-hover:opacity-100 transition"
            >
              {copied === 'sdk-integration' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
              <code className="text-sm text-slate-300 font-mono">{INTEGRATION_CODE_EXAMPLE.replace('PROJECT_ID', project.id)}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
