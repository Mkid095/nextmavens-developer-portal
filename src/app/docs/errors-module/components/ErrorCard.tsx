/**
 * Errors Documentation - Error Card Component
 */

import type { ErrorDoc } from '../types'
import { ERROR_COLOR_CLASSES } from '../constants'

interface ErrorCardProps {
  error: ErrorDoc
}

export function ErrorCard({ error }: ErrorCardProps) {
  const Icon = error.icon
  const colorClasses = ERROR_COLOR_CLASSES[error.color]

  return (
    <div key={error.code} id={error.code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClasses}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-semibold text-slate-900">{error.title}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    error.retryable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {error.retryable ? 'Retryable' : 'Not Retryable'}
                </span>
              </div>
              <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                {error.code}
              </code>
              <span className="text-sm text-slate-500 ml-3">HTTP {error.httpStatus}</span>
            </div>
          </div>
        </div>
        <p className="text-slate-600 mt-4">{error.description}</p>
      </div>

      <div className="p-6 bg-slate-50">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Common Causes</h4>
            <ul className="space-y-2">
              {error.commonCauses.map((cause, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span className="text-sm text-slate-600">{cause}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Solutions</h4>
            <ul className="space-y-2">
              {error.solutions.map((solution, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-1">✓</span>
                  <span className="text-sm text-slate-600">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
