/**
 * GraphQL Docs Module - Main View Component
 */

'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Server,
  Zap,
  CheckCircle,
  Code,
} from 'lucide-react'
import {
  GRAPHQL_CONFIG,
  QUERY_EXAMPLES,
  CONNECTION_ARGS,
  CODE_EXAMPLES,
  POSTGRAPHILE_FEATURES,
} from './constants'

/**
 * Simple code block with copy functionality component
 */
function CodeBlockWithCopy({ children }: { children: string }) {
  return (
    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
      <code>{children}</code>
    </pre>
  )
}

/**
 * GraphQL Documentation Page View
 */
export default function GraphQLDocsView() {
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
            <Link href="/docs/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1400px] px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Globe className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">GraphQL Service</h1>
            <p className="text-slate-600">Postgraphile-powered GraphQL with automatic schema generation</p>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Information</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">GraphQL Endpoint</span>
              </div>
              <code className="text-xs text-blue-700 break-all">{GRAPHQL_CONFIG.domain}/graphql</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">GraphiQL IDE</span>
              </div>
              <span className="text-xs text-slate-500 italic">
                Not currently available - use curl or other GraphQL clients
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Features</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {GRAPHQL_CONFIG.features.map((feat) => (
                  <span key={feat} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* About Postgraphile */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">About Postgraphile</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            NextMavens GraphQL is powered by Postgraphile, which automatically generates a GraphQL schema
            from your PostgreSQL database. This means you get type-safe queries, mutations, and subscriptions
            without writing any schema definition code.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {POSTGRAPHILE_FEATURES.map((feature) => (
              <div key={feature.title} className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Query Examples */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Query Examples</h2>
        <div className="space-y-6 mb-12">
          {QUERY_EXAMPLES.map((example, index) => (
            <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">{example.title}</h3>
              </div>
              <div className="p-6">
                <CodeBlockWithCopy>{example.code}</CodeBlockWithCopy>
                {example.variables && (
                  <div className="mt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Variables</h4>
                    <CodeBlockWithCopy>{JSON.stringify(example.variables, null, 2)}</CodeBlockWithCopy>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Connection Arguments */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Connection Arguments</h2>
          <p className="text-slate-600 mb-6">
            Postgraphile uses Relay-style connections for pagination. These arguments are available on
            collection fields (e.g., <code className="bg-slate-100 px-1 rounded">apiKeysByUserId</code>).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Argument</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
                </tr>
              </thead>
              <tbody>
                {CONNECTION_ARGS.map((arg) => (
                  <tr key={arg.name} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <code className="text-slate-900">{arg.name}</code>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{arg.type}</td>
                    <td className="py-3 px-4 text-slate-600">{arg.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Making Requests */}
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-slate-900">Making GraphQL Requests</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Using Fetch</h3>
              <CodeBlockWithCopy>{CODE_EXAMPLES.USING_FETCH}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Introspection Query</h3>
              <p className="text-slate-600 mb-3">
                Explore the schema using GraphQL introspection:
              </p>
              <CodeBlockWithCopy>{CODE_EXAMPLES.INTROSPECTION}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Using GraphQL Clients</h3>
              <p className="text-slate-600 mb-3">
                Use GraphQL clients like Apollo Explorer, Postman, or curl to interactively explore the schema:
              </p>
              <CodeBlockWithCopy>{CODE_EXAMPLES.USING_CLIENTS}</CodeBlockWithCopy>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/database" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Database Docs
          </Link>
          <Link href="/docs/realtime" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            Realtime Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
