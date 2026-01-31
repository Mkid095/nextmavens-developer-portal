'use client'

import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function SdkSemanticVersioning() {
  return (
    <section id="sdk-versioning" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📦</span>
        <h2 className="text-2xl font-semibold text-slate-900">SDK Semantic Versioning</h2>
      </div>

      <p className="text-slate-600 mb-6">
        The NextMavens JavaScript SDK follows <strong>Semantic Versioning (SemVer)</strong>:{' '}
        <code className="bg-emerald-50 px-2 py-1 rounded text-emerald-700 font-mono">MAJOR.MINOR.PATCH</code>
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-bold text-red-900 mb-2">MAJOR (X.0.0)</h3>
          <p className="text-sm text-red-800 mb-2">Incompatible API changes requiring code modifications.</p>
          <div className="bg-red-100 rounded p-2 mb-2">
            <code className="text-xs text-red-900 font-mono">1.0.0 → 2.0.0</code>
          </div>
          <ul className="mt-2 text-xs text-red-700 space-y-1">
            <li>• Removed or renamed methods</li>
            <li>• Changed method signatures</li>
            <li>• Modified return types</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900 mb-2">MINOR (0.X.0)</h3>
          <p className="text-sm text-yellow-800 mb-2">Backward-compatible functionality additions.</p>
          <div className="bg-yellow-100 rounded p-2 mb-2">
            <code className="text-xs text-yellow-900 font-mono">1.2.0 → 1.3.0</code>
          </div>
          <ul className="mt-2 text-xs text-yellow-700 space-y-1">
            <li>• New methods or features</li>
            <li>• New optional parameters</li>
            <li>• Extended functionality</li>
          </ul>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h3 className="font-bold text-emerald-900 mb-2">PATCH (0.0.X)</h3>
          <p className="text-sm text-emerald-800 mb-2">Backward-compatible bug fixes.</p>
          <div className="bg-emerald-100 rounded p-2 mb-2">
            <code className="text-xs text-emerald-900 font-mono">1.2.3 → 1.2.4</code>
          </div>
          <ul className="mt-2 text-xs text-emerald-700 space-y-1">
            <li>• Bug fixes</li>
            <li>• Performance improvements</li>
            <li>• Documentation updates</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-slate-900 mb-3">Compatibility Guarantees</h3>
        <div className="space-y-2 text-sm text-slate-600">
          <p>• <strong>Patch updates</strong> are always safe to upgrade</p>
          <p>• <strong>Minor updates</strong> are safe but may add new features</p>
          <p>• <strong>Major updates</strong> may require code changes</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-emerald-900 mb-2">Version Ranges in package.json</h3>
        <p className="text-sm text-emerald-800 mb-3">Use version ranges for automatic compatible updates:</p>
        <CodeBlockWithCopy>{`// Allow patch and minor updates (recommended)
"nextmavens-js": "^1.2.3"

// Allow only patch updates
"nextmavens-js": "~1.2.3"

// Exact version (not recommended)
"nextmavens-js": "1.2.3"`}</CodeBlockWithCopy>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Update Strategy</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Patch (1.2.3 → 1.2.4):</strong> Apply immediately - bug fixes</p>
          <p><strong>Minor (1.2.0 → 1.3.0):</strong> Apply when convenient - new features</p>
          <p><strong>Major (1.0.0 → 2.0.0):</strong> Review migration guide first</p>
        </div>
      </div>
    </section>
  )
}
