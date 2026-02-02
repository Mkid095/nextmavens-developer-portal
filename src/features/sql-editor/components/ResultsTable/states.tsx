/**
 * Results Table State Components
 */

export function LoadingState() {
  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Executing query...</p>
        </div>
      </div>
    </div>
  )
}

export function ErrorState({ error }: { error: string }) {
  return (
    <div className="border border-red-200 rounded-lg bg-red-50">
      <div className="p-4">
        <p className="text-sm text-red-800 font-medium">Query Error</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Run a query to see results here
          </p>
        </div>
      </div>
    </div>
  )
}

export function NoResultsState({ result }: { result: { executionTime: number; rowsAffected?: number } }) {
  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center justify-between p-3 border-b border-slate-100">
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          Results
        </span>
        <span className="text-xs text-slate-500">
          {result.executionTime}ms
          {result.rowsAffected !== undefined && (
            <span> • {result.rowsAffected} row{result.rowsAffected !== 1 ? 's' : ''} affected</span>
          )}
          {result.rowsAffected === undefined && <span> • 0 rows</span>}
        </span>
      </div>
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Query executed successfully but returned no results
          </p>
        </div>
      </div>
    </div>
  )
}
