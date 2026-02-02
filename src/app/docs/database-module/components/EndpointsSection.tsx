/**
 * Database Documentation - Module - Endpoints Section Component
 */

import { ENDPOINTS, METHOD_COLORS } from '../constants'

export function EndpointsSection() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">API Endpoints</h2>
      <div className="space-y-6 mb-12">
        {ENDPOINTS.map((endpoint) => (
          <div key={endpoint.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">{endpoint.name}</h3>
                  <p className="text-slate-600">{endpoint.description}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${METHOD_COLORS[endpoint.method]}`}>
                  {endpoint.method}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Endpoint:</span>
                <code className="bg-slate-100 px-2 py-0.5 rounded">{endpoint.path}</code>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-semibold text-slate-900 mb-3">Examples</h4>
              <div className="space-y-2">
                {endpoint.examples.map((example, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3">
                    <code className="text-sm text-blue-700 block mb-1">
                      https://api.nextmavens.cloud{example.url}
                    </code>
                    <p className="text-xs text-slate-600">{example.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
