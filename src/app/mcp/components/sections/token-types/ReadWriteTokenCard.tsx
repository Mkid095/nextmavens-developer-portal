/**
 * Read-Write Token Card
 *
 * Displays information about the read-write token type.
 */

import { Edit3, AlertTriangle } from 'lucide-react'
import { ScopeList, UseCaseList } from './'

const useCases = [
  'AI coding assistants that create database migrations',
  'Automation tools that insert or update records',
  'Data processing pipelines that modify your data',
  'Trusted AI tools that need full read/write access',
]

const scopes = [
  { scope: 'db:select', desc: 'Query database' },
  { scope: 'db:insert', desc: 'Insert records' },
  { scope: 'db:update', desc: 'Update records' },
  { scope: 'storage:read', desc: 'Read files' },
  { scope: 'storage:write', desc: 'Upload files' },
  { scope: 'realtime:subscribe', desc: 'Subscribe to events' },
  { scope: 'db:delete', desc: 'Delete records', disabled: true },
  { scope: 'auth:manage', desc: 'User management', disabled: true },
  { scope: 'realtime:publish', desc: 'Publish events', disabled: true },
]

export function ReadWriteTokenCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-xl">
            <Edit3 className="w-8 h-8 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-slate-900">Read-Write Token</h2>
              <code className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-mono">mcp_rw_</code>
            </div>
            <p className="text-slate-600">For trusted AI tools that need to create and modify data</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Requires opt-in
        </span>
      </div>

      <ScopeList scopes={scopes} />
      <UseCaseList useCases={useCases} checkColor="text-amber-600" />

      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Write Access Warning</h4>
            <p className="text-sm text-amber-700 mb-2">This token allows AI assistants to modify your data. Only grant to trusted AI systems that you control.</p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Read/write tokens can insert, update, and query data</li>
              <li>• Cannot delete records or manage users</li>
              <li>• Requires explicit opt-in confirmation during creation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
