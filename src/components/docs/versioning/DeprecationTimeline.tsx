'use client'

export function DeprecationTimeline() {
  return (
    <section id="deprecation-timeline" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⏰</span>
        <h2 className="text-2xl font-semibold text-slate-900">Deprecation Timeline</h2>
      </div>

      <p className="text-slate-600 mb-6">
        NextMavens provides advance notice before removing or changing features.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-bold text-red-900 mb-2">Breaking Changes</h3>
          <p className="text-3xl font-bold text-red-700 mb-2">6 months</p>
          <p className="text-sm text-red-800">Minimum notice period before breaking changes.</p>
          <ul className="mt-2 text-xs text-red-700 space-y-1">
            <li>• Announced in changelog</li>
            <li>• Marked as deprecated in API responses</li>
            <li>• Documentation updated with warnings</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900 mb-2">Deprecations</h3>
          <p className="text-3xl font-bold text-yellow-700 mb-2">3 months</p>
          <p className="text-sm text-yellow-800">Minimum notice period before deprecated features are removed.</p>
          <ul className="mt-2 text-xs text-yellow-700 space-y-1">
            <li>• <code className="bg-yellow-100 px-1 rounded">Deprecated</code> header added</li>
            <li>• Alternative solutions documented</li>
            <li>• Migration assistance provided</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-medium text-slate-900 mb-3">Deprecation Headers</h3>
        <p className="text-sm text-slate-600 mb-3">Deprecated endpoints return warning headers:</p>
        <div className="bg-slate-900 rounded-lg p-4">
          <code className="text-sm text-slate-300 font-mono block">{`Deprecated: true
Sunset: 2025-06-01
Alternative: /v2/projects`}</code>
        </div>
      </div>
    </section>
  )
}
