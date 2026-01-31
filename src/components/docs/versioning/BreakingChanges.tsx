'use client'

export function BreakingChanges() {
  return (
    <section id="breaking-changes" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⚠️</span>
        <h2 className="text-2xl font-semibold text-slate-900">Breaking Changes</h2>
      </div>

      <p className="text-slate-600 mb-6">
        Breaking changes are avoided whenever possible. When necessary, they follow a clear process.
      </p>

      <div className="space-y-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-bold text-red-900 mb-3">Examples of Breaking Changes</h3>
          <ul className="space-y-2 text-sm text-red-800">
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span><strong>Removed endpoints:</strong> Entire API endpoints removed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span><strong>Changed schemas:</strong> Request/response structures modified</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span><strong>Renamed fields:</strong> Field names changed in responses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span><strong>Type changes:</strong> Field data types altered</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span><strong>Required fields:</strong> Optional fields now required</span>
            </li>
          </ul>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="font-bold text-emerald-900 mb-3">NOT Breaking Changes</h3>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Adding new endpoints:</strong> Don't affect existing code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Adding optional fields:</strong> Backward compatible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Adding optional parameters:</strong> Don't break existing calls</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Bug fixes:</strong> Correcting behavior to match docs</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Process for Introducing Breaking Changes</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Announce change with 6+ months notice</li>
          <li>Mark affected endpoints as deprecated with warning headers</li>
          <li>Update documentation with migration instructions</li>
          <li>Provide migration guide with code examples</li>
          <li>Release new major version with breaking changes</li>
          <li>Maintain old version for 12 months after new release</li>
        </ol>
      </div>
    </section>
  )
}
