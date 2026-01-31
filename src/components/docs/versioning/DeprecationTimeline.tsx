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
            <li>• Documentation updated with warnings</li>
            <li>• Migration guide provided</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900 mb-2">Deprecations</h3>
          <p className="text-3xl font-bold text-yellow-700 mb-2">3 months</p>
          <p className="text-sm text-yellow-800">Minimum notice period before deprecated features are removed.</p>
          <ul className="mt-2 text-xs text-yellow-700 space-y-1">
            <li>• Alternative solutions documented</li>
            <li>• Migration assistance provided</li>
            <li>• Support team available</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-medium text-slate-900 mb-3">Current Status</h3>
        <p className="text-sm text-slate-600 mb-3">
          No endpoints or features are currently deprecated. All API v1 endpoints are fully supported.
        </p>
        <p className="text-sm text-slate-600">
          Check the <a href="/docs/changelog" className="text-emerald-700 hover:text-emerald-800 underline">changelog</a> for any announcements.
        </p>
      </div>
    </section>
  )
}
