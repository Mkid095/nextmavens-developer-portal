/**
 * API Keys Documentation - Environment Prefixes Component
 */

import { ENVIRONMENT_EXAMPLES } from '../constants'

export function EnvironmentPrefixes() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Environment Prefixes</h2>
      <p className="text-slate-600 mb-6">
        Each key type includes an environment suffix to separate production, staging, and development
        environments.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {ENVIRONMENT_EXAMPLES.map((env) => (
          <div key={env.env} className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-1">{env.env}</h3>
            <code className="text-xs text-slate-700 block mb-2">{env.suffix}</code>
            <p className="text-sm text-slate-600">{env.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
