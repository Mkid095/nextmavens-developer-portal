'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export function InfrastructureNavigation() {
  return (
    <div className="mt-12 flex items-center justify-between">
      <Link href="/docs/platform-philosophy" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Platform Philosophy
      </Link>
      <Link href="/docs/api-keys" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
        API Keys
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
