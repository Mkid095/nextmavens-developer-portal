/**
 * Changelog - Footer Component
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function Footer() {
  return (
    <div className="mt-12 flex items-center justify-between">
      <Link href="/docs/versioning" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Versioning Strategy
      </Link>
    </div>
  )
}
