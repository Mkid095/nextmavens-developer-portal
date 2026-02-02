/**
 * Results Table Header Component
 */

import { Download, Zap } from 'lucide-react'
import type { QueryResult } from './types'
import { handleExportCSV } from './csv-export'

interface ResultsHeaderProps {
  result: QueryResult
  onExport: () => void
}

export function ResultsHeader({ result, onExport }: ResultsHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Results
          </span>
          <span className="text-xs text-slate-500">
            {result.rowsAffected !== undefined
              ? `${result.rowsAffected} row${result.rowsAffected !== 1 ? 's' : ''} affected`
              : `${result.rowCount} row${result.rowCount !== 1 ? 's' : ''}`}
            {' '} • {result.executionTime}ms
          </span>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="Export to CSV"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* US-008: Query Plan Display (when available) */}
      {result.queryPlan && (
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Query Execution Plan
              </span>
            </div>
            <pre className="text-xs text-slate-700 overflow-x-auto p-3 bg-white border border-slate-200 rounded-lg">
              {JSON.stringify(result.queryPlan, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}
