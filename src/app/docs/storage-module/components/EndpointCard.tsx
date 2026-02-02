/**
 * Storage Documentation - Endpoint Card Component
 */

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'
import { STORAGE_CONFIG, METHOD_COLORS } from '../constants'
import type { Endpoint } from '../types'

interface EndpointCardProps {
  endpoint: Endpoint
}

export function EndpointCard({ endpoint }: EndpointCardProps) {
  const methodColor = METHOD_COLORS[endpoint.method] || 'bg-gray-100 text-gray-700'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-1">{endpoint.name}</h3>
            <p className="text-slate-600">{endpoint.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${methodColor}`}>
            {endpoint.method}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Endpoint:</span>
          <code className="bg-slate-100 px-2 py-0.5 rounded">
            {STORAGE_CONFIG.domain}
            {endpoint.path}
          </code>
        </div>
      </div>

      <div className="p-6">
        {endpoint.request && (
          <>
            <h4 className="font-semibold text-slate-900 mb-3">Request</h4>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <CodeBlockWithCopy>{JSON.stringify(endpoint.request, null, 2)}</CodeBlockWithCopy>
            </div>
          </>
        )}

        {endpoint.headers && (
          <>
            <h4 className="font-semibold text-slate-900 mb-3">Headers</h4>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <CodeBlockWithCopy>{JSON.stringify(endpoint.headers, null, 2)}</CodeBlockWithCopy>
            </div>
          </>
        )}

        {endpoint.queryParams && (
          <>
            <h4 className="font-semibold text-slate-900 mb-3">Query Parameters</h4>
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <CodeBlockWithCopy>
                {JSON.stringify(endpoint.queryParams, null, 2)}
              </CodeBlockWithCopy>
            </div>
          </>
        )}

        <h4 className="font-semibold text-slate-900 mb-3">Response</h4>
        <div className="bg-slate-50 rounded-lg p-3">
          <CodeBlockWithCopy>
            {JSON.stringify({ success: true, data: endpoint.response }, null, 2)}
          </CodeBlockWithCopy>
        </div>
      </div>
    </div>
  )
}
