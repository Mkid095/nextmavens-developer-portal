/**
 * API Keys Documentation - Overview Section Component
 */

export function OverviewSection() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
      <p className="text-slate-600 leading-relaxed mb-4">
        NextMavens uses different API key types to provide granular access control and security. Each key
        type has specific scopes, use cases, and security considerations.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Prefix Format</h3>
          <p className="text-sm text-slate-600">Keys start with a type prefix and environment suffix</p>
          <code className="text-xs text-slate-700 mt-2 block">pk_prod_, sk_test_, sr_dev_</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Scope-Based</h3>
          <p className="text-sm text-slate-600">Each key has granular permissions (scopes)</p>
          <code className="text-xs text-slate-700 mt-2 block">db:select, storage:read</code>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Environment Isolated</h3>
          <p className="text-sm text-slate-600">Keys are scoped to specific environments</p>
          <code className="text-xs text-slate-700 mt-2 block">prod, test, dev</code>
        </div>
      </div>
    </div>
  )
}
