/**
 * API Keys Tab - Security Warning Component
 */

import { AlertCircle } from 'lucide-react'
import { SECURITY_BEST_PRACTICES } from '../constants'

export function SecurityWarning() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-red-900 mb-1">Security Best Practices</h4>
          <ul className="text-sm text-red-800 space-y-1">
            {SECURITY_BEST_PRACTICES.map((practice, index) => (
              <li key={index}>• {practice}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
