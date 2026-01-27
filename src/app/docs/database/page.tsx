'use client'

import Link from 'next/link'
import { Database, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { motion } from 'framer-motion'

const tools = [
  {
    name: 'nextmavens_query',
    description: 'Execute SQL SELECT queries',
    method: 'POST',
    endpoint: '/database/query',
    params: [
      { name: 'query', type: 'string', required: true, description: 'SQL SELECT query to execute' },
      { name: 'params', type: 'array', required: false, description: 'Query parameters for prepared statements' },
    ],
    response: {
      rows: 'Array of result objects',
      rowCount: 'Number of rows returned',
    },
    example: {
      query: 'SELECT * FROM users WHERE email = $1',
      params: ['user@example.com'],
    },
  },
  {
    name: 'nextmavens_insert',
    description: 'Insert new records into a table',
    method: 'POST',
    endpoint: '/database/insert',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Target table name' },
      { name: 'data', type: 'object', required: true, description: 'Data to insert as key-value pairs' },
    ],
    response: {
      rows: 'Inserted row data',
      rowCount: 'Number of rows inserted (usually 1)',
    },
    example: {
      table: 'users',
      data: { email: 'user@example.com', name: 'John Doe' },
    },
  },
  {
    name: 'nextmavens_update',
    description: 'Update existing records',
    method: 'POST',
    endpoint: '/database/update',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Target table name' },
      { name: 'data', type: 'object', required: true, description: 'Data to update as key-value pairs' },
      { name: 'where', type: 'object', required: true, description: 'WHERE clause conditions' },
    ],
    response: {
      rows: 'Updated row data',
      rowCount: 'Number of rows updated',
    },
    example: {
      table: 'users',
      data: { name: 'Jane Doe' },
      where: { id: 123 },
    },
  },
  {
    name: 'nextmavens_delete',
    description: 'Delete records from a table',
    method: 'POST',
    endpoint: '/database/delete',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Target table name' },
      { name: 'where', type: 'object', required: true, description: 'WHERE clause conditions' },
    ],
    response: {
      rowCount: 'Number of rows deleted',
    },
    example: {
      table: 'users',
      where: { id: 123 },
    },
  },
]

export default function DatabaseDocsPage() {
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
            <Database className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Database Service</h1>
            <p className="text-slate-600">PostgreSQL-powered data operations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-200 mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Overview</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The Database service provides direct access to PostgreSQL with full CRUD operations.
            All queries use prepared statements to prevent SQL injection and ensure security.
          </p>
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">Base URL</h3>
            <code className="text-sm text-slate-700">https://api.nextmavens.cloud/database</code>
          </div>
        </div>

        <div className="space-y-8">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">{tool.name}</h3>
                    <p className="text-slate-600">{tool.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {tool.method}
                  </span>
                </div>
                <code className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded block">
                  {tool.endpoint}
                </code>
              </div>

              <div className="p-6">
                <h4 className="font-semibold text-slate-900 mb-4">Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Required</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tool.params.map((param) => (
                        <tr key={param.name} className="border-b border-slate-100">
                          <td className="py-3 px-4">
                            <code className="text-slate-900">{param.name}</code>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{param.type}</td>
                          <td className="py-3 px-4">
                            {param.required ? (
                              <span className="text-red-600">Required</span>
                            ) : (
                              <span className="text-slate-500">Optional</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="font-semibold text-slate-900 mt-6 mb-4">Example Request</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
                    <code>{JSON.stringify(tool.example, null, 2)}</code>
                  </pre>
                </div>

                <h4 className="font-semibold text-slate-900 mt-6 mb-4">Response</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-300">
                    <code>{JSON.stringify({ success: true, data: tool.response }, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
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
