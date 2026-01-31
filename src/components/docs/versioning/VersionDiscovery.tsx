'use client'

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function VersionDiscovery() {
  return (
    <section id="version-discovery" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔍</span>
        <h2 className="text-2xl font-semibold text-slate-900">API Endpoint Discovery</h2>
      </div>

      <p className="text-slate-600 mb-6">
        Discover available API services by querying the API gateway root endpoint.
      </p>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-slate-900 mb-2">GET /</h3>
        <p className="text-sm text-slate-600 mb-3">Query the gateway endpoint:</p>
        <CodeBlockWithCopy>{`curl https://api.nextmavens.cloud/`}</CodeBlockWithCopy>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-slate-900 mb-2">Response Format</h3>
        <CodeBlockWithCopy>{`{
  "name": "NextMavens API Gateway",
  "version": "1.0.0",
  "description": "Central gateway for all NextMavens services",
  "endpoints": {
    "auth": "/api/auth/*",
    "rest": "/api/*",
    "graphql": "/graphql",
    "realtime": "/realtime",
    "storage": "/api/storage/*",
    "developer": "/api/developer/*"
  },
  "documentation": "https://docs.nextmavens.cloud"
}`}</CodeBlockWithCopy>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Response Fields</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>name:</strong> Service name</li>
          <li><strong>version:</strong> Current gateway version</li>
          <li><strong>endpoints:</strong> Available service routes</li>
          <li><strong>documentation:</strong> Link to full docs</li>
        </ul>
      </div>
    </section>
  )
}
