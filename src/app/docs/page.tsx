import Link from 'next/link'
import { Database, Shield, HardDrive, Globe, BookOpen, ArrowRight, ChevronRight } from 'lucide-react'

const chapters = [
  {
    id: 'database',
    title: 'Database',
    description: 'PostgreSQL-powered queries with full CRUD operations',
    icon: Database,
    color: 'blue',
    tools: ['query', 'insert', 'update', 'delete'],
    path: '/docs/database',
  },
  {
    id: 'auth',
    title: 'Authentication',
    description: 'Secure user authentication with JWT tokens',
    icon: Shield,
    color: 'purple',
    tools: ['signin', 'signup'],
    path: '/docs/auth',
  },
  {
    id: 'storage',
    title: 'Storage',
    description: 'File storage with CDN integration',
    icon: HardDrive,
    color: 'orange',
    tools: ['file_info', 'file_download_url', 'list_files'],
    path: '/docs/storage',
  },
  {
    id: 'graphql',
    title: 'GraphQL',
    description: 'GraphQL queries with schema introspection',
    icon: Globe,
    color: 'emerald',
    tools: ['graphql', 'graphql_introspect'],
    path: '/docs/graphql',
  },
  {
    id: 'mcp',
    title: 'MCP Integration',
    description: 'Model Context Protocol for AI/IDE integration',
    icon: Globe,
    color: 'teal',
    tools: ['11 AI-powered tools'],
    path: '/mcp',
  },
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
            <Link href="/register" className="text-sm bg-emerald-900 text-white px-4 py-2 rounded-full hover:bg-emerald-800">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-16">
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-emerald-700" />
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">Documentation</h1>
          </div>
          <p className="text-xl text-slate-600">
            Complete guide to integrating NextMavens services into your applications.
            Learn how to use Database, Authentication, Storage, GraphQL, and MCP tools.
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Service Chapters</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {chapters.map((chapter) => {
              const Icon = chapter.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-700',
                purple: 'bg-purple-100 text-purple-700',
                orange: 'bg-orange-100 text-orange-700',
                emerald: 'bg-emerald-100 text-emerald-700',
                teal: 'bg-teal-100 text-teal-700',
              }[chapter.color]

              return (
                <Link
                  key={chapter.id}
                  href={chapter.path}
                  className="group bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colorClasses}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-700">
                        {chapter.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3">{chapter.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {chapter.tools.slice(0, 3).map((tool) => (
                            <span
                              key={tool}
                              className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded"
                            >
                              {tool}
                            </span>
                          ))}
                          {chapter.tools.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                              +{chapter.tools.length - 3}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Quick Start</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Create an Account</h3>
                <p className="text-slate-600">Sign up at <Link href="/register" className="text-emerald-700 hover:text-emerald-800">/register</Link> to get your API keys.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Get Your API Keys</h3>
                <p className="text-slate-600">Visit the dashboard to create public and secret API keys for your applications.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Choose Your Integration</h3>
                <p className="text-slate-600">Use direct REST API calls or integrate MCP for AI-powered development.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
