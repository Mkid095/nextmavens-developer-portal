import Link from 'next/link'
import { Database, Shield, HardDrive, Globe, BookOpen, ChevronRight, Server, Lightbulb, Radio, Code2, AlertCircle, Key, FileText, Tag, Zap, ArrowRight, DatabaseBackup } from 'lucide-react'

const services = [
  {
    id: 'api-gateway',
    title: 'API Gateway',
    description: 'Central entry point for all API requests with rate limiting, authentication, and routing',
    icon: Server,
    color: 'indigo',
    domain: 'https://api.nextmavens.cloud',
    port: 8080,
    endpoints: ['/api/auth', '/api', '/graphql', '/realtime', '/api/storage', '/api/developer'],
    features: ['Rate Limiting', 'JWT Validation', 'Request Logging', 'CORS'],
    path: '#api-gateway',
  },
  {
    id: 'auth',
    title: 'Authentication Service',
    description: 'User registration, login, and JWT token management',
    icon: Shield,
    color: 'purple',
    domain: 'https://auth.nextmavens.cloud',
    port: 4000,
    endpoints: ['/api/auth/login', '/api/auth/signup', '/api/auth/refresh', '/api/auth/logout'],
    features: ['JWT Tokens', 'bcrypt Hashing', 'Refresh Tokens', 'Session Management'],
    path: '/docs/auth',
  },
  {
    id: 'database',
    title: 'Database / PostgREST',
    description: 'PostgreSQL with full REST API access via PostgREST',
    icon: Database,
    color: 'blue',
    domain: 'https://api.nextmavens.cloud',
    port: 3001,
    endpoints: ['/{table}', '/rpc/{function}', '/graphql'],
    features: ['CRUD Operations', 'RLS Policies', 'Prepared Statements', 'Multi-tenant'],
    path: '/docs/database',
  },
  {
    id: 'graphql',
    title: 'GraphQL Service',
    description: 'Postgraphile-powered GraphQL with automatic schema generation',
    icon: Globe,
    color: 'emerald',
    domain: 'https://api.nextmavens.cloud',
    port: 4004,
    endpoints: ['/graphql', '/graphiql'],
    features: ['Auto Schema', 'Relations', 'Mutations', 'Subscriptions'],
    path: '/docs/graphql',
  },
  {
    id: 'realtime',
    title: 'Realtime Service',
    description: 'PostgreSQL LISTEN/NOTIFY for realtime data subscriptions',
    icon: Radio,
    color: 'emerald',
    domain: 'https://api.nextmavens.cloud',
    port: 4003,
    endpoints: ['/realtime/subscribe', '/realtime/publish'],
    features: ['WebSocket', 'CDC Events', 'Channel Subscriptions', 'Event Streaming'],
    path: '/docs/realtime',
  },
  {
    id: 'storage',
    title: 'Telegram Storage',
    description: 'File storage via Telegram with CDN access',
    icon: HardDrive,
    color: 'orange',
    domain: 'https://telegram-api.nextmavens.cloud',
    port: 4005,
    endpoints: ['/api/files', '/api/files/{id}/download', '/webhook/telegram'],
    features: ['File Upload', 'CDN URLs', 'Metadata', 'Telegram Integration'],
    path: '/docs/storage',
  },
  {
    id: 'mcp',
    title: 'MCP Server',
    description: 'Model Context Protocol for AI/IDE integration with 11+ tools',
    icon: Zap,
    color: 'teal',
    domain: 'https://api.nextmavens.cloud',
    port: 8080,
    endpoints: ['/mcp'],
    features: ['11 AI Tools', 'Claude/Cursor Compatible', 'Scoped Access', 'Audit Logged'],
    path: '/docs/mcp',
  },
]

const quickReference = [
  { name: 'API Gateway', url: 'https://api.nextmavens.cloud', description: 'Main API entry point' },
  { name: 'Developer Portal', url: 'https://portal.nextmavens.cloud', description: 'Dashboard & project management' },
  { name: 'Dokploy', url: 'https://dokploy.nextmavens.cloud', description: 'Deployment management' },
  { name: 'Auth Service', url: 'https://auth.nextmavens.cloud', description: 'User authentication' },
  { name: 'Telegram Storage', url: 'https://telegram-api.nextmavens.cloud', description: 'File storage API' },
  { name: 'Telegram Bot', url: 'https://telegram.nextmavens.cloud', description: 'Deployment notifications' },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1400px] px-4 py-4 flex items-center justify-between">
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
            <Link href="/register" className="text-sm bg-emerald-900 text-white px-4 py-2 rounded-full hover:bg-emerald-800">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-4 py-16">
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-emerald-700" />
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">Documentation</h1>
          </div>
          <p className="text-xl text-slate-600 mb-4">
            Complete guide to the NextMavens platform. Learn how to use our APIs, services, and tools.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Base URL:</strong> <code className="bg-white px-2 py-1 rounded">https://api.nextmavens.cloud</code>
            </p>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Quick Reference</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Service</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Public URL</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quickReference.map((ref) => (
                    <tr key={ref.name} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{ref.name}</td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-blue-700 hover:text-blue-800">
                          {ref.url}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ref.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Platform Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => {
              const Icon = service.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-700',
                purple: 'bg-purple-100 text-purple-700',
                orange: 'bg-orange-100 text-orange-700',
                emerald: 'bg-emerald-100 text-emerald-700',
                teal: 'bg-teal-100 text-teal-700',
                slate: 'bg-slate-100 text-slate-700',
                indigo: 'bg-indigo-100 text-indigo-700',
              }[service.color]

              return (
                <Link
                  key={service.id}
                  href={service.path}
                  className="group bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${colorClasses}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-emerald-700">
                        {service.title}
                      </h3>
                      <p className="text-sm text-slate-600">{service.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-slate-700">Domain:</span>
                      <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{service.domain}</code>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {service.endpoints.slice(0, 3).map((ep) => (
                        <span key={ep} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {ep}
                        </span>
                      ))}
                      {service.endpoints.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          +{service.endpoints.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {service.features.slice(0, 3).map((feat) => (
                        <span key={feat} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all ml-auto" />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Additional Docs Chapters */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/docs/api-keys" className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition">
              <Key className="w-8 h-8 text-indigo-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">API Keys</h3>
              <p className="text-sm text-slate-600">Understanding key types, scopes, and security best practices</p>
            </Link>
            <Link href="/docs/sdk" className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition">
              <Code2 className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">JavaScript SDK</h3>
              <p className="text-sm text-slate-600">Official TypeScript client for NextMavens platform</p>
            </Link>
            <Link href="/docs/errors" className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition">
              <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Codes</h3>
              <p className="text-sm text-slate-600">Complete API error reference and troubleshooting guide</p>
            </Link>
            <Link href="/docs/backups" className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition">
              <DatabaseBackup className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Backup Strategy</h3>
              <p className="text-sm text-slate-600">Database and storage backup with retention policies</p>
            </Link>
            <Link href="/docs/infrastructure" className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition">
              <Server className="w-8 h-8 text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Infrastructure</h3>
              <p className="text-sm text-slate-600">Deployment architecture, scaling, and operations</p>
            </Link>
            <Link href="/docs/changelog" className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition">
              <FileText className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Changelog</h3>
              <p className="text-sm text-slate-600">Latest updates, improvements, and fixes</p>
            </Link>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Quick Start</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Create an Account</h3>
                <p className="text-slate-600 mb-3">Sign up at <Link href="/register" className="text-emerald-700 hover:text-emerald-800">/register</Link> to get your API keys</p>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded">https://portal.nextmavens.cloud/register</code>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Get Your API Key</h3>
                <p className="text-slate-600 mb-3">Create an API key in the dashboard with the appropriate scopes</p>
                <div className="flex gap-2 text-xs">
                  <code className="bg-slate-100 px-2 py-1 rounded">pk_live_</code>
                  <code className="bg-slate-100 px-2 py-1 rounded">sk_live_</code>
                  <code className="bg-slate-100 px-2 py-1 rounded">mcp_ro_</code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-2">Make Your First Request</h3>
                <p className="text-slate-600 mb-3">Use your API key to authenticate requests</p>
                <div className="bg-slate-900 rounded-lg p-4">
                  <code className="text-xs text-emerald-400 block">
                    curl https://api.nextmavens.cloud/users \<br />
                    &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY"
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
