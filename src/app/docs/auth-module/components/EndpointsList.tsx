/**
 * Authentication Documentation - Module - Endpoints List Component
 */

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import { AUTH_CONFIG, ENDPOINTS } from '../constants'

export function EndpointsList() {
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
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  {endpoint.method}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Direct:</span>
                  <code className="ml-1 bg-slate-100 px-2 py-0.5 rounded">{AUTH_CONFIG.domain}{endpoint.path}</code>
                </div>
                <div>
                  <span className="text-slate-500">Via Gateway:</span>
                  <code className="ml-1 bg-slate-100 px-2 py-0.5 rounded">https://api.nextmavens.cloud{endpoint.gatewayPath}</code>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-semibold text-slate-900 mb-3">Request</h4>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {endpoint.request && (
                  <div>
                    <h5 className="text-xs font-medium text-slate-700 mb-2">Body Parameters</h5>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <CodeBlockWithCopy>{JSON.stringify(endpoint.request, null, 2)}</CodeBlockWithCopy>
                    </div>
                  </div>
                )}
                {endpoint.headers && (
                  <div>
                    <h5 className="text-xs font-medium text-slate-700 mb-2">Headers</h5>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <CodeBlockWithCopy>{JSON.stringify(endpoint.headers, null, 2)}</CodeBlockWithCopy>
                    </div>
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-slate-900 mb-3">Response</h4>
              <div className="bg-slate-50 rounded-lg p-3">
                <CodeBlockWithCopy>{JSON.stringify({ success: true, data: endpoint.response }, null, 2)}</CodeBlockWithCopy>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
