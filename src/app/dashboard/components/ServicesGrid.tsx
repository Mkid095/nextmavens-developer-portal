/**
 * Services Grid Component
 *
 * Displays the available services grid.
 */

'use client'

import Link from 'next/link'
import { Globe, Database, Shield, HardDrive } from 'lucide-react'

export function ServicesGrid() {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Available Services</h2>
      </div>
      <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/mcp" className="p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition">
          <Globe className="w-8 h-8 text-emerald-700 mb-3" />
          <h3 className="font-medium text-slate-900">MCP</h3>
          <p className="text-sm text-slate-600 mt-1">Model Context Protocol integration</p>
        </Link>

        <div className="p-4 border border-slate-200 rounded-xl">
          <Database className="w-8 h-8 text-blue-700 mb-3" />
          <h3 className="font-medium text-slate-900">Database</h3>
          <p className="text-sm text-slate-600 mt-1">PostgreSQL-powered queries</p>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl">
          <Shield className="w-8 h-8 text-purple-700 mb-3" />
          <h3 className="font-medium text-slate-900">Auth</h3>
          <p className="text-sm text-slate-600 mt-1">Authentication & authorization</p>
        </div>

        <div className="p-4 border border-slate-200 rounded-xl">
          <HardDrive className="w-8 h-8 text-orange-700 mb-3" />
          <h3 className="font-medium text-slate-900">Storage</h3>
          <p className="text-sm text-slate-600 mt-1">File storage & CDN</p>
        </div>
      </div>
    </div>
  )
}
