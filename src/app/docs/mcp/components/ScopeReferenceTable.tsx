/**
 * Scope Reference Table Component
 */

import { scopeDescriptions } from '../constants'

export function ScopeReferenceTable() {
  const scopes: (keyof typeof scopeDescriptions)[] = [
    'db:select', 'db:insert', 'db:update', 'db:delete', 'db:admin',
    'storage:read', 'storage:write', 'storage:admin',
    'graphql:execute', 'realtime:read', 'realtime:manage',
    'project:create', 'project:read', 'project:update', 'project:delete',
    'key:create', 'key:read', 'key:delete', 'auth:manage'
  ]

  const colorClasses = {
    'db:select': 'text-emerald-700',
    'db:insert': 'text-amber-700',
    'db:update': 'text-amber-700',
    'db:delete': 'text-red-700',
    'db:admin': 'text-red-700',
    'storage:read': 'text-emerald-700',
    'storage:write': 'text-amber-700',
    'storage:admin': 'text-red-700',
    'graphql:execute': 'text-emerald-700',
    'realtime:read': 'text-emerald-700',
    'realtime:manage': 'text-red-700',
    'project:create': 'text-red-700',
    'project:read': 'text-emerald-700',
    'project:update': 'text-amber-700',
    'project:delete': 'text-red-700',
    'key:create': 'text-red-700',
    'key:read': 'text-emerald-700',
    'key:delete': 'text-red-700',
    'auth:manage': 'text-red-700',
  }

  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Scope Reference</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Scope</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
              <th className="text-center py-3 px-4 font-semibold text-emerald-700">Read-Only</th>
              <th className="text-center py-3 px-4 font-semibold text-amber-700">Read-Write</th>
              <th className="text-center py-3 px-4 font-semibold text-red-700">Admin</th>
            </tr>
          </thead>
          <tbody>
            {scopes.map((scope) => (
              <tr key={scope} className="border-b border-slate-100">
                <td className="py-3 px-4"><code className={`bg-slate-100 px-2 py-1 rounded ${colorClasses[scope]}`}>{scope}</code></td>
                <td className="py-3 px-4 text-slate-600">{scopeDescriptions[scope]}</td>
                <td className="py-3 px-4 text-center">
                  {['db:select', 'storage:read', 'graphql:execute', 'realtime:read', 'project:read', 'key:read'].includes(scope) ? '✓' : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  {['db:insert', 'db:update', 'storage:read', 'storage:write', 'graphql:execute', 'realtime:read', 'project:read', 'key:read'].includes(scope) ? '✓' : '—'}
                </td>
                <td className="py-3 px-4 text-center">
                  {['db:delete', 'db:admin', 'storage:admin', 'realtime:manage', 'project:delete', 'key:delete', 'auth:manage'].includes(scope) ? '✓' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
