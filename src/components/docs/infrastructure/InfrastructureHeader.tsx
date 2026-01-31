'use client'

import Link from 'next/link'
import { Server, ArrowLeft } from 'lucide-react'

export function InfrastructureHeader() {
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
            <Link href="/docs/mcp" className="text-sm text-slate-600 hover:text-slate-900">MCP</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Login</Link>
            <Link href="/register" className="text-sm bg-emerald-900 text-white px-4 py-2 rounded-full hover:bg-emerald-800">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-16">
        <Link href="/docs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Server className="w-6 h-6 text-blue-700" />
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">Infrastructure Documentation</h1>
          </div>
          <p className="text-xl text-slate-600">
            Current deployment architecture, scaling roadmap, and operational procedures for NextMavens platform.
          </p>
        </div>
      </main>
    </div>
  )
}
