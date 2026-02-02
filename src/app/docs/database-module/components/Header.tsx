/**
 * Database Documentation - Module - Header Component
 */

import Link from 'next/link'
import { ArrowLeft, Database } from 'lucide-react'

export function Header() {
  return (
    <>
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
    </>
  )
}
