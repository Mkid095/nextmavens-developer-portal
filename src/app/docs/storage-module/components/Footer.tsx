/**
 * Storage Documentation - Footer Component
 */

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export function Footer() {
  return (
    <div className="mt-12 flex items-center justify-between">
      <Link href="/docs/graphql" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        GraphQL Docs
      </Link>
      <Link href="/docs/realtime" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
        Realtime Docs
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
