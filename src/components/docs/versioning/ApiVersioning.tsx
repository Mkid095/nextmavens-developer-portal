'use client'

import { Code2, BookOpen, Github, FileText as FileTextIcon, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import CodeBlockWithCopy from '@/components/docs/CodeBlockWithCopy'

export function ApiVersioning() {
  return (
    <section id="api-versioning" className="bg-white rounded-xl p-8 border border-slate-200 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔌</span>
        <h2 className="text-2xl font-semibold text-slate-900">API Versioning</h2>
      </div>

      <p className="text-slate-600 mb-6">
        The NextMavens API is currently in active development with a single stable version. All endpoints
        are accessible through the API gateway at <code className="bg-slate-100 px-2 py-1 rounded">api.nextmavens.cloud</code>.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">REST API</h3>
          <p className="text-sm text-slate-600 mb-3">RESTful endpoints for database and auth operations:</p>
          <CodeBlockWithCopy>{`https://api.nextmavens.cloud/api/{service}`}</CodeBlockWithCopy>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">GraphQL</h3>
          <p className="text-sm text-slate-600 mb-3">GraphQL endpoint for flexible queries:</p>
          <CodeBlockWithCopy>{`https://api.nextmavens.cloud/graphql`}</CodeBlockWithCopy>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Realtime (WebSocket)</h3>
          <p className="text-sm text-slate-600 mb-3">WebSocket endpoint for live updates:</p>
          <CodeBlockWithCopy>{`wss://api.nextmavens.cloud/realtime`}</CodeBlockWithCopy>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-2">Storage</h3>
          <p className="text-sm text-slate-600 mb-3">File storage via Telegram integration:</p>
          <CodeBlockWithCopy>{`https://telegram-api.nextmavens.cloud`}</CodeBlockWithCopy>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Current Status</h3>
        <p className="text-sm text-blue-800">
          The API is currently in version 1.0.0 with no breaking changes planned. Future versions will be
          announced at least 6 months in advance through the changelog and documentation.
        </p>
      </div>
    </section>
  )
}
