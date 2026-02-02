/**
 * Admin Token Card
 *
 * Displays information about the admin token type.
 */

import { Lock, AlertTriangle } from 'lucide-react'
import { ScopeList, UseCaseList } from './'

const useCases = [
  'AI operations tools that manage your entire stack',
  'Automation scripts that need full lifecycle management',
  'Trusted AI DevOps assistants for production systems',
  'Advanced AI tools that require destructive operations',
]

const scopes = [
  { scope: 'db:select', desc: 'Query database' },
  { scope: 'db:insert', desc: 'Insert records' },
  { scope: 'db:update', desc: 'Update records' },
  { scope: 'db:delete', desc: 'Delete records' },
  { scope: 'storage:read', desc: 'Read files' },
  { scope: 'storage:write', desc: 'Upload files' },
  { scope: 'auth:manage', desc: 'User management' },
  { scope: 'realtime:subscribe', desc: 'Subscribe to events' },
  { scope: 'realtime:publish', desc: 'Publish events' },
  { scope: 'graphql:execute', desc: 'GraphQL queries' },
]

export function AdminTokenCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-100 rounded-xl">
            <Lock className="w-8 h-8 text-red-700" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-slate-900">Admin Token</h2>
              <code className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-mono">mcp_admin_</code>
            </div>
            <p className="text-slate-600">Full access including destructive operations - use with extreme caution</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Extra confirmation
        </span>
      </div>

      <ScopeList scopes={scopes} />
      <UseCaseList useCases={useCases} checkColor="text-red-600" />

      <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Critical Warning - Full Access</h4>
            <p className="text-sm text-red-700 mb-2">This token has full administrative access including destructive operations.</p>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Can delete records and drop tables</li>
              <li>• Can manage users and authentication</li>
              <li>• Can perform any database operation</li>
              <li>• Requires TWO confirmation steps during creation</li>
              <li>• Only grant to AI systems you fully trust and control</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 rounded-xl p-4 border border-slate-300">
        <h4 className="font-semibold text-slate-900 mb-2">Best Practices</h4>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>• Start with read-only tokens, upgrade only when needed</li>
          <li>• Use admin tokens only in controlled environments</li>
          <li>• Rotate admin tokens regularly</li>
          <li>• Monitor admin token usage in audit logs</li>
          <li>• Never share admin tokens in public repositories</li>
        </ul>
      </div>
    </div>
  )
}
