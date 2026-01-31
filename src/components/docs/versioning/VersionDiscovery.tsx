'use client'

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function VersionDiscovery() {
  return (
    <section id="version-discovery" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔍</span>
        <h2 className="text-2xl font-semibold text-slate-900">Version Discovery</h2>
      </div>

      <p className="text-slate-600 mb-6">
        Discover available API versions programmatically to build version-aware clients.
      </p>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-slate-900 mb-2">GET /versions</h3>
        <p className="text-sm text-slate-600 mb-3">Query the versions endpoint:</p>
        <CodeBlockWithCopy>{`curl https://api.nextmavens.cloud/versions`}</CodeBlockWithCopy>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-slate-900 mb-2">Response Format</h3>
        <CodeBlockWithCopy>{`{
  "versions": [
    {
      "version": "v2",
      "current": true,
      "stable": true,
      "deprecated": false,
      "sunset_date": null,
      "url": "https://api.nextmavens.cloud/v2"
    },
    {
      "version": "v1",
      "current": false,
      "stable": true,
      "deprecated": true,
      "sunset_date": "2025-06-01",
      "url": "https://api.nextmavens.cloud/v1"
    }
  ]
}`}</CodeBlockWithCopy>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Response Fields</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>current:</strong> Latest stable version</li>
          <li><strong>stable:</strong> Recommended for production</li>
          <li><strong>deprecated:</strong> Whether deprecated</li>
          <li><strong>sunset_date:</strong> When support ends</li>
        </ul>
      </div>
    </section>
  )
}
