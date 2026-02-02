/**
 * GraphQL Documentation - Module - Header Component
 */

import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'

export function Header() {
  return (
    <>
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
    </>
  )
}
