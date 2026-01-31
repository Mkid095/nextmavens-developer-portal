'use client'

import Link from 'next/link'
import { Code2, ArrowLeft } from 'lucide-react'

export function SdkHeader() {
  return (
    <div className="min-h-screen bg-[#F3F5F7]">
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
            <Code2 className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">API Reference</h1>
            <p className="text-slate-600">Direct API access using REST, GraphQL, and WebSocket</p>
          </div>
        </div>
      </main>
    </div>
  )
}
