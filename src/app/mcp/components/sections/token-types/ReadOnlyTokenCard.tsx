/**
 * Read-Only Token Card
 *
 * Displays information about the read-only token type.
 */

import { Eye, Shield } from 'lucide-react'
import { ScopeList, UseCaseList } from './'

const useCases = [
  'AI assistants that analyze data but never modify it',
  'Code generation tools that need schema context',
  'Chatbots that answer questions about your data',
  'Documentation assistants that explain your database structure',
]

const scopes = [
  { scope: 'db:select', desc: 'Query database' },
  { scope: 'storage:read', desc: 'Read files' },
  { scope: 'realtime:subscribe', desc: 'Subscribe to events' },
  { scope: 'auth:signin', desc: 'Sign in users', disabled: true },
  { scope: 'graphql:execute', desc: 'GraphQL queries', disabled: true },
]

export function ReadOnlyTokenCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-100 rounded-xl">
            <Eye className="w-8 h-8 text-blue-700" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold text-slate-900">Read-Only Token</h2>
              <code className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono">mcp_ro_</code>
            </div>
            <p className="text-slate-600">Safest option for AI assistants that only need to read data</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          Default
        </span>
      </div>

      <ScopeList scopes={scopes} />
      <UseCaseList useCases={useCases} checkColor="text-blue-600" />

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Safest Option</h4>
            <p className="text-sm text-blue-700">Read-only tokens cannot modify your data, making them safe to use with untrusted AI tools. Ideal for exploration and analysis.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
