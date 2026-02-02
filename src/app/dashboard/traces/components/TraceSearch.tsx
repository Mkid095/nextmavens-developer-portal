/**
 * Trace Search Component
 * Search form for finding request traces by ID
 */

import { Search, AlertCircle, Loader2 } from 'lucide-react'

interface TraceSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearch: (e: React.FormEvent) => void
  loading: boolean
}

export function TraceSearch({ searchQuery, onSearchChange, onSearch, loading }: TraceSearchProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Search by Request ID</h2>
      <form onSubmit={onSearch} className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Enter request ID (UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className="px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search
            </>
          )}
        </button>
      </form>

      {/* Info text about finding request IDs */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to find Request IDs</p>
            <p className="text-blue-700">
              Request IDs (correlation IDs) are returned in the{' '}
              <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">x-request-id</code>{' '}
              response header for all API requests. You can also find them in log entries and audit
              logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
