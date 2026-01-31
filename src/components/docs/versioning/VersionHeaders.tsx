'use client'

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function VersionHeaders() {
  return (
    <section id="version-headers" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📋</span>
        <h2 className="text-2xl font-semibold text-slate-900">Request Headers</h2>
      </div>

      <p className="text-slate-600 mb-6">
        API requests use standard HTTP headers for authentication and content negotiation.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-3">Authentication</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Authorization</p>
              <p className="text-xs text-slate-500 mb-2">Bearer token authentication</p>
              <CodeBlockWithCopy>{`Authorization: Bearer YOUR_API_KEY`}</CodeBlockWithCopy>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-3">Content Type</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Content-Type</p>
              <p className="text-xs text-slate-500 mb-2">Specify request body format</p>
              <CodeBlockWithCopy>{`Content-Type: application/json`}</CodeBlockWithCopy>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-medium text-slate-900 mb-3">Example Request</h3>
        <CodeBlockWithCopy>{`curl https://api.nextmavens.cloud/api/auth/login \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"email":"user@example.com","password":"password"}'`}</CodeBlockWithCopy>
      </div>
    </section>
  )
}
