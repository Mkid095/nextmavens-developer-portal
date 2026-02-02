/**
 * GraphQL Documentation - Module - Service Info Component
 */

import { Server, CheckCircle, Zap } from 'lucide-react'
import { GRAPHQL_CONFIG } from '../constants'

export function ServiceInfo() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Information</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">GraphQL Endpoint</span>
          </div>
          <code className="text-xs text-blue-700 break-all">{GRAPHQL_CONFIG.domain}/graphql</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">GraphiQL IDE</span>
          </div>
          <span className="text-xs text-slate-500 italic">
            Not currently available - use curl or other GraphQL clients
          </span>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-700">Features</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {GRAPHQL_CONFIG.features.map((feat) => (
              <span key={feat} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
