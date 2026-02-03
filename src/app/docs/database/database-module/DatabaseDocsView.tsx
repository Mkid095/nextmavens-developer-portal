/**
 * Database Docs Module - Main View Component
 */

'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Server,
  CheckCircle,
  Filter,
  Code,
  Table,
} from 'lucide-react'
import {
  DATABASE_CONFIG,
  API_ENDPOINTS,
  FILTER_OPERATORS,
  AVAILABLE_TABLES,
  METHOD_COLORS,
  CODE_EXAMPLES,
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
 * Database Documentation Page View
 */
export default function DatabaseDocsView() {
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
          <div className="p-3 bg-blue-100 rounded-xl">
            <Database className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Database / PostgREST</h1>
            <p className="text-slate-600">PostgreSQL with full REST API access</p>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Base URL</span>
              </div>
              <code className="text-xs text-blue-700 break-all">{DATABASE_CONFIG.domain}</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">Features</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {DATABASE_CONFIG.features.map((feat) => (
                  <span key={feat} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">API Endpoints</h2>
        <div className="space-y-6 mb-12">
          {API_ENDPOINTS.map((endpoint) => (
            <div key={endpoint.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{endpoint.name}</h3>
                    <p className="text-slate-600">{endpoint.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      METHOD_COLORS[endpoint.method]?.bg || 'bg-gray-100'
                    } ${METHOD_COLORS[endpoint.method]?.text || 'text-gray-700'}`}
                  >
                    {endpoint.method}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Endpoint:</span>
                  <code className="bg-slate-100 px-2 py-0.5 rounded">{endpoint.path}</code>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-semibold text-slate-900 mb-3">Examples</h4>
                <div className="space-y-2">
                  {endpoint.examples.map((example, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3">
                      <code className="text-sm text-blue-700 block mb-1">
                        {DATABASE_CONFIG.domain}
                        {example.url}
                      </code>
                      <p className="text-xs text-slate-600">{example.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Operators */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Query Filters & Operators</h2>
          </div>
          <p className="text-slate-600 mb-6">
            PostgREST provides powerful filtering capabilities through query string operators.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Operator</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Example</th>
                </tr>
              </thead>
              <tbody>
                {FILTER_OPERATORS.map((op) => (
                  <tr key={op.operator} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                        {op.operator}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{op.description}</td>
                    <td className="py-3 px-4">
                      <code className="text-xs text-slate-700">{op.example}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Code Examples</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Fetch with JavaScript</h3>
              <CodeBlockWithCopy>{CODE_EXAMPLES.FETCH_WITH_FILTERS}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Create Record</h3>
              <CodeBlockWithCopy>{CODE_EXAMPLES.CREATE_RECORD}</CodeBlockWithCopy>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Update Record</h3>
              <CodeBlockWithCopy>{CODE_EXAMPLES.UPDATE_RECORD}</CodeBlockWithCopy>
            </div>
          </div>
        </div>

        {/* Schema Tables */}
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Table className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">Available Tables</h2>
          </div>
          <p className="text-slate-600 mb-6">
            Common tables accessible via PostgREST (actual tables depend on your schema):
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {AVAILABLE_TABLES.map((table) => (
              <Link
                key={table}
                href={`${DATABASE_CONFIG.domain}/${table}?limit=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-50 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition"
              >
                <code className="text-blue-700 font-medium">/{table}</code>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs/auth" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Authentication
          </Link>
          <Link href="/docs/graphql" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
            GraphQL Docs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
