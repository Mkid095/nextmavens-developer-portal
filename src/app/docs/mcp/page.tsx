'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Shield, Code2, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const mcpTokenTypes = [
  {
    id: 'mcp_ro',
    name: 'Read-Only MCP Token',
    icon: Shield,
    prefix: 'mcp_ro_',
    color: 'emerald',
    description: 'The safest token type for AI assistants. Can read data but cannot modify anything.',
    useCases: [
      'AI code assistants that need to read your data schema',
      'Documentation generators',
      'Analytics tools',
      'Data exploration by AI',
    ],
    scopes: ['db:select', 'storage:read', 'realtime:subscribe'],
    examples: [
      { scenario: 'Schema inspection', desc: 'AI reads your database structure to understand relationships' },
      { scenario: 'Documentation', desc: 'AI generates API documentation from your GraphQL schema' },
      { scenario: 'Analytics queries', desc: 'AI runs read-only queries to analyze data trends' },
    ],
    warning: 'Can be safely shared with most AI tools - read-only access cannot modify data',
    security: 'Low risk - AI cannot modify your data',
  },
  {
    id: 'mcp_rw',
    name: 'Write MCP Token',
    icon: Code2,
    prefix: 'mcp_rw_',
    color: 'amber',
    description: 'Allows AI tools to both read and write data. Requires explicit opt-in with warning confirmation.',
    useCases: [
      'Trusted AI development tools',
      'Automated data migration assistants',
      'Code generation with schema modifications',
      'AI-powered data synchronization',
    ],
    scopes: ['db:select', 'db:insert', 'db:update', 'storage:read', 'storage:write', 'graphql:execute'],
    examples: [
      { scenario: 'Schema migrations', desc: 'AI generates and applies database schema changes' },
      { scenario: 'Data seeding', desc: 'AI populates database with test data for development' },
      { scenario: 'Content updates', desc: 'AI updates database records based on user input' },
    ],
    warning: 'This AI can modify your data. Only grant to trusted AI systems.',
    security: 'Medium-high risk - AI can create and modify data',
  },
  {
    id: 'mcp_admin',
    name: 'Admin MCP Token',
    icon: Zap,
    prefix: 'mcp_admin_',
    color: 'red',
    description: 'Full administrative access. Bypasses row-level security (RLS) and can manage all resources.',
    useCases: [
      'AI-powered operations tools',
      'Automated infrastructure management',
      'Emergency recovery systems',
      'Trusted AI ops assistants',
    ],
    scopes: [
      'db:select',
      'db:insert',
      'db:update',
      'db:delete',
      'storage:read',
      'storage:write',
      'auth:manage',
      'graphql:execute',
      'realtime:subscribe',
      'realtime:publish',
      'secrets:read',
    ],
    examples: [
      { scenario: 'User management', desc: 'AI creates, updates, or deactivates user accounts' },
      { scenario: 'Data cleanup', desc: 'AI performs bulk deletion operations for maintenance' },
      { scenario: 'Emergency recovery', desc: 'AI helps recover from data corruption or accidental deletions' },
    ],
    warning: 'Highest risk - AI has full control including destructive operations and user management',
    security: 'Very high risk - AI has full control',
  },
]

const scopeDefinitions = [
  { scope: 'db:select', description: 'Query database tables', ro: true, rw: true, admin: true },
  { scope: 'db:insert', description: 'Insert new records', ro: false, rw: true, admin: true },
  { scope: 'db:update', description: 'Update existing records', ro: false, rw: true, admin: true },
  { scope: 'db:delete', description: 'Delete records', ro: false, rw: false, admin: true },
  { scope: 'storage:read', description: 'Read files from storage', ro: true, rw: true, admin: true },
  { scope: 'storage:write', description: 'Upload/modify files', ro: false, rw: true, admin: true },
  { scope: 'auth:manage', description: 'Manage users and authentication', ro: false, rw: false, admin: true },
  { scope: 'realtime:subscribe', description: 'Subscribe to channels', ro: true, rw: true, admin: true },
  { scope: 'realtime:publish', description: 'Publish to channels', ro: false, rw: false, admin: true },
  { scope: 'graphql:execute', description: 'Execute GraphQL mutations', ro: false, rw: true, admin: true },
  { scope: 'secrets:read', description: 'Read sensitive secrets', ro: false, rw: false, admin: true },
]

const aiTools = [
  { name: 'Claude Code', category: 'Code Assistant', recommended: 'mcp_ro_' },
  { name: 'Cursor', category: 'IDE', recommended: 'mcp_rw_' },
  { name: 'GitHub Copilot', category: 'Code Assistant', recommended: 'mcp_ro_' },
  { name: 'ChatGPT', category: 'AI Assistant', recommended: 'mcp_ro_' },
  { name: 'Custom AI Agents', category: 'Automation', recommended: 'mcp_admin_' },
]

export default function MCPDocsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/docs" className="text-sm text-slate-900 font-medium">Docs</Link>
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP Integration</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Code2 className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">MCP Token Documentation</h1>
            <p className="text-slate-600">Understanding MCP token types, scopes, and when to use each</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">What are MCP Tokens?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            MCP (Model Context Protocol) tokens are API keys designed specifically for AI tools and assistants.
            They provide controlled access to platform resources with safety guardrails to prevent unintended
            modifications by AI systems.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Read-Only by Default</h3>
              <p className="text-sm text-slate-600">MCP tokens default to read-only access for safety</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Explicit Opt-In</h3>
              <p className="text-sm text-slate-600">Write access requires explicit confirmation</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Audit Logged</h3>
              <p className="text-sm text-slate-600">All MCP actions are heavily audited</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-slate-900 mb-6">MCP Token Types</h2>
        <div className="space-y-8 mb-12">
          {mcpTokenTypes.map((tokenType, index) => {
            const Icon = tokenType.icon
            const colorClasses = {
              emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
              amber: 'bg-amber-100 text-amber-700 border-amber-200',
              red: 'bg-red-100 text-red-700 border-red-200',
            }[tokenType.color]

            const warningClasses = {
              emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
              amber: 'bg-amber-50 border-amber-200 text-amber-800',
              red: 'bg-red-50 border-red-200 text-red-800',
            }[tokenType.color]

            return (
              <motion.div
                key={tokenType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className={`p-6 border-b ${colorClasses}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${colorClasses}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{tokenType.name}</h3>
                        <p className="text-slate-600 text-sm">{tokenType.description}</p>
                      </div>
                    </div>
                    <code className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded font-mono">
                      {tokenType.prefix}
                    </code>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Use Cases</h4>
                      <ul className="space-y-2">
                        {tokenType.useCases.map((useCase) => (
                          <li key={useCase} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Included Scopes</h4>
                      <div className="flex flex-wrap gap-2">
                        {tokenType.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded font-mono"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {tokenType.examples && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">When to Use This Token</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {tokenType.examples.map((example) => (
                          <div key={example.scenario} className="bg-slate-50 rounded-lg p-3">
                            <h5 className="font-medium text-slate-900 text-sm mb-1">{example.scenario}</h5>
                            <p className="text-xs text-slate-600">{example.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`mt-4 p-4 rounded-lg border ${warningClasses}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-medium mb-1">Security Notice</h5>
                        <p className="text-sm">{tokenType.warning}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2">Risk Level</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        tokenType.security.includes('Very high')
                          ? 'bg-red-100 text-red-700'
                          : tokenType.security.includes('Medium-high')
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {tokenType.security}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Scope Reference</h2>
          <p className="text-slate-600 mb-6">
            Understanding what each scope allows and which token types include it
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Scope</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                  <th className="text-center py-3 px-4 font-semibold text-emerald-700">Read-Only</th>
                  <th className="text-center py-3 px-4 font-semibold text-amber-700">Write</th>
                  <th className="text-center py-3 px-4 font-semibold text-red-700">Admin</th>
                </tr>
              </thead>
              <tbody>
                {scopeDefinitions.map((scope) => (
                  <tr key={scope.scope} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs">{scope.scope}</code>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{scope.description}</td>
                    <td className="py-3 px-4 text-center">
                      {scope.ro ? <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" /> : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {scope.rw ? <CheckCircle className="w-4 h-4 text-amber-600 mx-auto" /> : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {scope.admin ? <CheckCircle className="w-4 h-4 text-red-600 mx-auto" /> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">AI Tool Recommendations</h2>
          <p className="text-slate-600 mb-6">
            Recommended MCP token types for common AI tools and use cases
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map((tool) => (
              <div key={tool.name} className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-1">{tool.name}</h3>
                <p className="text-xs text-slate-600 mb-2">{tool.category}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Recommended:</span>
                  <code className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-mono">
                    {tool.recommended}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-8 border border-amber-200 mb-12">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            Write Access Warnings
          </h2>
          <div className="space-y-4 text-amber-800">
            <p className="font-medium">
              When creating write-enabled MCP tokens (mcp_rw_, mcp_admin_), you'll see a warning
              explaining the risks:
            </p>
            <div className="bg-white/50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm mb-3">
                <strong>This AI can modify your data.</strong> Only grant to trusted AI systems.
              </p>
              <ul className="text-sm space-y-1">
                <li>• Read/write tokens can insert/update/delete data</li>
                <li>• Admin tokens have full access including destructive operations</li>
                <li>• These permissions should only be granted to trusted systems</li>
              </ul>
            </div>
            <p className="text-sm">
              You must explicitly confirm that you understand the risks before the token is created.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Best Practices</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Start with Read-Only</h3>
                <p className="text-sm text-slate-600">
                  Always begin with <code className="bg-slate-100 px-1 rounded">mcp_ro_</code> tokens
                  and only upgrade if the AI tool needs write access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Rotate Regularly</h3>
                <p className="text-sm text-slate-600">
                  Set expiration dates and rotate MCP tokens periodically to limit exposure.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Monitor Usage</h3>
                <p className="text-sm text-slate-600">
                  Check audit logs regularly for unusual AI tool activity or suspicious operations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Scope Narrowly</h3>
                <p className="text-sm text-slate-600">
                  Create separate tokens for different AI tools and tasks to minimize blast radius.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                5
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Never Expose Client-Side</h3>
                <p className="text-sm text-slate-600">
                  MCP tokens should only be used server-side or in trusted AI tools, never in browsers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/api-keys" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            API Keys Docs
          </Link>
          <Link href="/docs/auth" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Authentication Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
