'use client'

import Link from 'next/link'
import { Key, ArrowLeft, ArrowRight, Shield, Globe, Server, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

const keyTypes = [
  {
    id: 'public',
    name: 'Public Key',
    icon: Globe,
    prefix: 'pk_live_',
    color: 'blue',
    description: 'Client-side keys for browsers and mobile apps with read-only access',
    useCases: [
      'Web applications running in browsers',
      'Mobile apps (iOS, Android)',
      'Public-facing applications',
      'Read-only data access',
    ],
    scopes: ['db:select', 'storage:read', 'auth:signin', 'realtime:subscribe'],
    warning: 'Can be safely exposed in client-side code',
    security: 'Low risk - read-only access only',
  },
  {
    id: 'secret',
    name: 'Secret Key',
    icon: Key,
    prefix: 'sk_live_',
    color: 'purple',
    description: 'Server-side keys with full CRUD access for backend applications',
    useCases: [
      'Node.js/Python/Go backend services',
      'Server-to-server communication',
      'API integrations',
      'Data processing jobs',
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
    ],
    warning: 'NEVER expose in client-side code (browsers, mobile apps)',
    security: 'High risk - must be kept secret',
  },
  {
    id: 'service_role',
    name: 'Service Role Key',
    icon: Shield,
    prefix: 'sr_live_',
    color: 'red',
    description: 'Admin keys that bypass row-level security for trusted backend operations',
    useCases: [
      'Administrative tasks',
      'Data migrations',
      'Background jobs',
      'Trusted server-side operations',
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
    ],
    warning: 'Bypasses row-level security (RLS) - use with extreme caution',
    security: 'Very high risk - full administrative access',
  },
  {
    id: 'mcp',
    name: 'MCP Token',
    icon: Server,
    prefix: 'mcp_ro_',
    color: 'teal',
    description: 'AI/IDE integration tokens for Model Context Protocol',
    useCases: [
      'AI-powered code generation',
      'IDE integrations (Claude, Cursor, etc.)',
      'Automated development workflows',
      'AI-assisted database operations',
    ],
    scopes: ['db:select', 'db:insert', 'db:update', 'db:delete', 'storage:read', 'storage:write', 'graphql:execute'],
    warning: 'Share only with trusted AI tools and IDEs',
    security: 'Medium risk - scope depends on access level',
    accessLevels: ['mcp_ro_ (read-only)', 'mcp_rw_ (read-write)', 'mcp_admin_ (full access)'],
  },
]

const environmentExamples = [
  {
    env: 'Production',
    suffix: '_prod_',
    description: 'For live production environments',
  },
  {
    env: 'Staging',
    suffix: '_test_',
    description: 'For testing and staging environments',
  },
  {
    env: 'Development',
    suffix: '_dev_',
    description: 'For local development',
  },
]

export default function ApiKeysDocsPage() {
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
            <Link href="/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
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
          <div className="p-3 bg-blue-100 rounded-xl">
            <Key className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">API Keys</h1>
            <p className="text-slate-600">Understanding key types, scopes, and when to use each</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            NextMavens uses different API key types to provide granular access control and security.
            Each key type has specific scopes, use cases, and security considerations.
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

        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Key Types</h2>
        <div className="space-y-8 mb-12">
          {keyTypes.map((keyType, index) => {
            const Icon = keyType.icon
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-700 border-blue-200',
              purple: 'bg-purple-100 text-purple-700 border-purple-200',
              red: 'bg-red-100 text-red-700 border-red-200',
              teal: 'bg-teal-100 text-teal-700 border-teal-200',
            }[keyType.color] || 'bg-slate-100 text-slate-700 border-slate-200'

            const warningClasses = {
              blue: 'bg-blue-50 border-blue-200 text-blue-800',
              purple: 'bg-purple-50 border-purple-200 text-purple-800',
              red: 'bg-red-50 border-red-200 text-red-800',
              teal: 'bg-teal-50 border-teal-200 text-teal-800',
            }[keyType.color] || 'bg-slate-50 border-slate-200 text-slate-800'

            return (
              <motion.div
                key={keyType.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className={`p-6 border-b ${colorClasses.replace('bg-', 'border-').split(' ')[0]}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${colorClasses}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{keyType.name}</h3>
                        <p className="text-slate-600 text-sm">{keyType.description}</p>
                      </div>
                    </div>
                    <code className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded font-mono">
                      {keyType.prefix}
                    </code>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Use Cases</h4>
                      <ul className="space-y-2">
                        {keyType.useCases.map((useCase) => (
                          <li key={useCase} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-emerald-600 mt-0.5">✓</span>
                            {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Included Scopes</h4>
                      <div className="flex flex-wrap gap-2">
                        {keyType.scopes.map((scope) => (
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

                  <div className={`mt-4 p-4 rounded-lg border ${warningClasses}`}>
                    <div className="flex items-start gap-2">
                      <Eye className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-medium mb-1">Security Notice</h5>
                        <p className="text-sm">{keyType.warning}</p>
                      </div>
                    </div>
                  </div>

                  {keyType.accessLevels && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Access Levels</h4>
                      <div className="flex flex-wrap gap-2">
                        {keyType.accessLevels.map((level) => (
                          <span
                            key={level}
                            className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded font-mono"
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2">Risk Level</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        keyType.security.includes('Very high')
                          ? 'bg-red-100 text-red-700'
                          : keyType.security.includes('High')
                            ? 'bg-orange-100 text-orange-700'
                            : keyType.security.includes('Medium')
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {keyType.security}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Environment Prefixes</h2>
          <p className="text-slate-600 mb-6">
            Each key type includes an environment suffix to separate production, staging, and development
            environments.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {environmentExamples.map((env) => (
              <div key={env.env} className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-1">{env.env}</h3>
                <code className="text-xs text-slate-700 block mb-2">{env.suffix}</code>
                <p className="text-sm text-slate-600">{env.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Example Key Format</h2>
          <CodeBlockWithCopy>{`// Public key for production
pk_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

// Secret key for staging
sk_test_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4

// Service role for development
sr_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7

// MCP read-only token
mcp_ro_q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6`}</CodeBlockWithCopy>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Best Practices</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Use the Right Key Type</h3>
                <p className="text-sm text-slate-600">
                  Always use public keys for client-side applications. Only use secret keys on trusted
                  servers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Keep Keys Secret</h3>
                <p className="text-sm text-slate-600">
                  Never commit keys to git, include them in client bundles, or share them publicly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Use Environment Variables</h3>
                <p className="text-sm text-slate-600">
                  Store keys in environment variables or secret management systems, never in code.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Rotate Keys Regularly</h3>
                <p className="text-sm text-slate-600">
                  Periodically rotate keys and revoke old ones to maintain security.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                5
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-1">Monitor Usage</h3>
                <p className="text-sm text-slate-600">
                  Check key usage stats regularly to detect unusual activity or compromised keys.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/auth" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Authentication Docs
          </Link>
          <Link href="/docs/sdk" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            SDK Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
