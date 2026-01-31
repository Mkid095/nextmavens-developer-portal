'use client'

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function VersionHeaders() {
  return (
    <section id="version-headers" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📋</span>
        <h2 className="text-2xl font-semibold text-slate-900">Version Headers</h2>
      </div>

      <p className="text-slate-600 mb-6">
        API responses include version headers to help identify the API version and deprecation status.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-3">Request Headers</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">X-API-Version</p>
              <p className="text-xs text-slate-500 mb-2">Specify API version (overrides URL path)</p>
              <CodeBlockWithCopy>{`X-API-Version: 1`}</CodeBlockWithCopy>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-3">Response Headers</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">API-Version</p>
              <p className="text-xs text-slate-500 mb-2">Version that handled the request</p>
              <CodeBlockWithCopy>{`API-Version: v1`}</CodeBlockWithCopy>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Deprecated</p>
              <p className="text-xs text-slate-500 mb-2">Present if version is deprecated</p>
              <CodeBlockWithCopy>{`Deprecated: true`}</CodeBlockWithCopy>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-medium text-slate-900 mb-3">Header Examples</h3>
        <CodeBlockWithCopy>{`# Request
curl https://api.nextmavens.cloud/v1/projects \\
  -H "X-API-Version: 1" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response Headers
API-Version: v1
Deprecated: true
Sunset: 2025-06-01`}</CodeBlockWithCopy>
      </div>
    </section>
  )
}
