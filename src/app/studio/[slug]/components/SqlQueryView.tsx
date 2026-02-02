/**
 * SQL Query View Component
 * Contains SQL editor, results, and query history/saved queries panels
 */

import { Clock, Bookmark } from 'lucide-react'
import { SqlEditor } from '@/features/sql-editor'
import { ResultsTable } from '@/features/sql-editor/components/ResultsTable'
import { QueryHistoryPanel } from '@/features/sql-editor/components/QueryHistory'
import { SavedQueriesPanel } from '@/features/sql-editor/components/SavedQueries'
import type { UserRole } from '../types'
import { PermissionBanner } from './PermissionBanner'

interface SqlQueryViewProps {
  sqlQuery: string
  onSqlQueryChange: (query: string) => void
  queryResults: any
  queryError: string | null
  isExecuting: boolean
  onExecuteQuery: (query: string, readonly: boolean, explain?: boolean) => void
  userRole: UserRole
  permissionsLoading: boolean
  showQueryHistory: boolean
  showSavedQueries: boolean
  onShowQueryHistory: () => void
  onShowSavedQueries: () => void
  onSelectQueryFromHistory: (query: string, readonly: boolean) => void
  onSelectSavedQuery: (query: string) => void
}

export function SqlQueryView({
  sqlQuery,
  onSqlQueryChange,
  queryResults,
  queryError,
  isExecuting,
  onExecuteQuery,
  userRole,
  permissionsLoading,
  showQueryHistory,
  showSavedQueries,
  onShowQueryHistory,
  onShowSavedQueries,
  onSelectQueryFromHistory,
  onSelectSavedQuery,
}: SqlQueryViewProps) {
  return (
    <div className="flex gap-6 h-full">
      {/* Main SQL Editor Section */}
      <div
        className={`flex flex-col gap-6 ${
          showQueryHistory || showSavedQueries ? 'flex-1' : 'w-full'
        }`}
      >
        {/* Permission banner showing user's role and allowed operations */}
        {!permissionsLoading && <PermissionBanner userRole={userRole} />}

        {/* SQL Editor with read-only mode */}
        <SqlEditor
          value={sqlQuery}
          onChange={onSqlQueryChange}
          onExecute={onExecuteQuery}
          userRole={userRole}
          height="300px"
        />

        {/* Error display */}
        {queryError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-900">Query Error</p>
            <p className="text-sm text-red-700 mt-1">{queryError}</p>
          </div>
        )}

        {/* Loading indicator */}
        {isExecuting && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-slate-600">Executing query...</span>
          </div>
        )}

        {/* Query results */}
        {queryResults && !isExecuting && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-900">Query Results</h3>
              <span className="text-xs text-slate-500">
                {queryResults.rowCount} row{queryResults.rowCount !== 1 ? 's' : ''} •{' '}
                {queryResults.executionTime}ms
              </span>
            </div>
            <ResultsTable result={queryResults} />
          </div>
        )}
      </div>

      {/* Query History Panel / Saved Queries Panel */}
      {(showQueryHistory || showSavedQueries) && (
        <div className="w-80 flex-shrink-0 flex flex-col">
          {/* Tab toggle between History and Saved Queries */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-lg">
            <button
              onClick={onShowQueryHistory}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
                showQueryHistory
                  ? 'text-emerald-700 border-b-2 border-emerald-700 bg-emerald-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              History
            </button>
            <button
              onClick={onShowSavedQueries}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
                showSavedQueries
                  ? 'text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-auto bg-white border border-t-0 border-slate-200 rounded-b-lg">
            {showQueryHistory && (
              <QueryHistoryPanel onSelectQuery={onSelectQueryFromHistory} />
            )}
            {showSavedQueries && (
              <SavedQueriesPanel
                onSelectQuery={onSelectSavedQuery}
                className="border-0 rounded-none"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
