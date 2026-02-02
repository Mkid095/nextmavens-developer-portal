/**
 * Authentication Documentation - Module - Security Practices Component
 */

import { CheckCircle } from 'lucide-react'
import { SECURITY_PRACTICES } from '../constants'

export function SecurityPractices() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Security Best Practices</h2>
      <div className="space-y-4">
        {SECURITY_PRACTICES.map((practice, index) => (
          <div key={index} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-slate-900 mb-1">{practice.title}</h3>
              <p className="text-sm text-slate-600">{practice.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
