/**
 * Database Documentation - Module - Schema Tables Component
 */

import Link from 'next/link'
import { Table } from 'lucide-react'
import { DATABASE_CONFIG, AVAILABLE_TABLES } from '../constants'

export function SchemaTables() {
  return (
    <div className="bg-white rounded-xl p-8 border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <Table className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-slate-900">Available Tables</h2>
      </div>
      <p className="text-slate-600 mb-6">
        Common tables accessible via PostgREST (actual tables depend on your schema):
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {AVAILABLE_TABLES.map((table) => (
          <Link
            key={table}
            href={`${DATABASE_CONFIG.domain}/${table}?limit=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-50 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 border border-transparent transition"
          >
            <code className="text-blue-700 font-medium">/{table}</code>
          </Link>
        ))}
      </div>
    </div>
  )
}
