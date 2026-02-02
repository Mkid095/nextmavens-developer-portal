/**
 * SQL Editor Components - Toolbar
 */

import { Play, ShieldAlert, Lock, History, Zap, Wand2, Bookmark } from 'lucide-react'
import type { UserRole } from './types'
import { extractSqlCommand } from './utils'

export function SqlEditorToolbar({
  query,
  readonlyMode,
  userRole,
  setReadonlyMode,
  canDisableReadonly,
  onExecute,
  onFormat,
  onExplain,
  onSave,
}: {
  query: string
  readonlyMode: boolean
  userRole: UserRole
  setReadonlyMode: (value: boolean) => void
  canDisableReadonly: () => boolean
  onExecute: () => void
  onFormat: () => void
  onExplain: () => void
  onSave: () => void
}) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            SQL Editor
          </span>
          <span className="text-xs text-slate-400">
            Ctrl+Enter to run • Ctrl+Shift+F to format
          </span>
        </div>
        {/* US-005: Read-only checkbox (checked by default) */}
        {/* US-011: Enforce RBAC - viewers cannot disable readonly */}
        <label className={`flex items-center gap-2 ${
          !canDisableReadonly() ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group'
        }`}>
          <input
            type="checkbox"
            checked={readonlyMode}
            onChange={(e) => {
              if (canDisableReadonly()) {
                setReadonlyMode(e.target.checked)
              }
            }}
            disabled={!canDisableReadonly()}
            className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition">
            Read-only
          </span>
          {!readonlyMode && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
              Write enabled
            </span>
          )}
          {!canDisableReadonly() && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium" title={`Your role '${userRole}' cannot disable read-only mode`}>
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
        </label>
      </div>
      <div className="flex items-center gap-2">
        {/* US-010: Save Query button */}
        <button
          onClick={onSave}
          disabled={!query.trim()}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Save this query for later use"
        >
          <Bookmark className="w-4 h-4" />
          Save
        </button>
        {/* US-009: Format SQL button */}
        <button
          onClick={onFormat}
          disabled={!query.trim()}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Format SQL (Ctrl+Shift+F)"
        >
          <Wand2 className="w-4 h-4" />
          Format
        </button>
        {/* US-008: Explain button for query plan */}
        <button
          onClick={onExplain}
          disabled={!query.trim()}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Run EXPLAIN ANALYZE to see query execution plan"
        >
          <Zap className="w-4 h-4" />
          Explain
        </button>
        <button
          onClick={onExecute}
          disabled={!query.trim()}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Play className="w-4 h-4" />
          Run Query
        </button>
      </div>
    </div>
  )
}

export function DestructiveQueryWarning({
  query,
  onCancel
}: {
  query: string
  onCancel: () => void
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900">
          Destructive Query Detected
        </p>
        <p className="text-xs text-amber-700 mt-1">
          This query contains a destructive command ({extractSqlCommand(query)}). To execute this query, you must uncheck <strong>Read-only</strong> mode above.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 rounded transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
