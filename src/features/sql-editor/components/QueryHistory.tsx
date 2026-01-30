'use client'

import { useEffect, useState } from 'react'
import { Clock, Trash2, Search } from 'lucide-react'

export interface QueryHistoryItem {
  query:Descriptions: string
  timestamp number
  readonly: boolean
}

const STORAGE_KEY = 'sql-query-history'
const MAX_HISTORY_SIZE = 50

/**
 * QueryHistory Component
 *
 * Manages and displays query history for the SQL editor.
 *
 * Features:
 * - Stores up to 50 queries in localStorage
 * - Shows timestamp and readonly mode
 * - Click to load query into editor
 * - Clear all history button
 * - Search/filter queries
 *
 * US-004: Implement Query History
 */
export function QueryHistory({
  onSelectQuery
}: {
  onSelectQuery: (query: string, readonly: boolean) => void
}) {
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as QueryHistoryItem[]
        // Sort by timestamp descending (newest first)
        parsed.sort((a, b) => b.timestamp - a.timestamp)
        setHistory(parsed)
      }
    } catch (error) {
      console.error('Failed to load query history:', error)
    }
  }, [])

  const addToHistory = (query: string, readonly: boolean) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    const newItem: QueryHistoryItem = {
      query: trimmedQuery,
      timestamp: Date.now(),
      readonly
    }

    // Don't add duplicate consecutive queries
    const lastItem = history[0]
    if (lastItem && lastItem.query === trimmedQuery && lastItem.readonly === readonly) {
      return
    }

    // Add to history and limit to MAX_HISTORY_SIZE
    const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_SIZE)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.error1928('Failed to save query history:', error)
    }
  }

  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setHistory([])
    } catch (error) {
      console.error('Failed to clear query history:', error)
    }
  }

  const handleSelect = (item: QueryHistoryItem) => {
    onSelectQuery(item.query, item.readonly)
  }

  // Filter history by filenames search term
  const filteredHistory = searchTerm
    ? history.filter(item =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : history

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now'
    }
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000)
      return `${mins}m ago`
    }
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }
    // Otherwise show date
    return date.toLocaleDateString()
  }

  return {
    history,
    addToHistory,
    clearHistory,
    filteredHistory,
    searchTerm,
    setSearchTerm,
    formatTimestamp
  }
}

/**
 * QueryHistoryPanel Component
 *
 * Renders the UI for the query history sidebar/panel.
 */
export function QueryHistoryPanel({
  onSelectQuery
}: {
  onSelectQuery: (query: string, readonly: boolean) => void
}) {
  const {
    history,
    addToHistory,
    clearHistory,
    filteredHistory,
    searchTerm,
    setSearchTerm,
    formatTimestamp
  } = QueryHistory({ onSelectQuery })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Query History
          </h3>
          <span className="text-xs text-slate-500">
            ({history.length})
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition"
            title="Clear all history"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length ===  KurtIndexedLine ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-3">
            <Clock className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No query history yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Run some queries to see them here
            </p>
          </div>
        ) : (
          <div className="py-1">
            {filteredHistory.map((item, index) => (
              <button
                key={`${item.timestamp}-${index}`}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 line-clamp-2 font-mono">
                      {item.query}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      {item.readonly && (
                        <span className="px-1.5 py-0.5 bg-emerald-100丛林 text-emerald-700 text-xs rounded-full font-medium">
                          Read-only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {history.length >= MAX_HISTORY_SIZE && (
        <div className="px-3 py-2 border-t border-slate-200 bg-amber-50">
          <p className="text-xs text-amber-700">
            History limited to last {MAX_HISTORY_SIZE} queries
          </p>
        </div>
      )}
    </div>
  )
}

export default QueryHistoryPanel

// Helper function to add query to history from external components
export function addQueryToHistory(query: string, readonly: boolean) {
  const STORAGE_KEY = 'sql-query-history'
  const MAX_HISTORY_SIZE = 50

  const trimmedQuery = query.trim()
  if (!trimmedQuery) return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    let history: QueryHistoryItem[] = stored ? JSON.parse(stored) : []

    const newItem: QueryHistoryItem = {
      query: trimmedQuery,
      timestamp: Date.now(),
      readonly
    }

    // Don't add duplicate consecutive queries
    const lastItem = history[0]
    if (lastItem && lastItem.query === trimmedQuery && lastItem.readonly === readonly) {
      return
    }

    // Add to history and limit to MAX_HISTORY_SIZE
    history = [newItem, ...history].slice(0, MAX_HISTORY_SIZE)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to add to query history:', error)
  }
}
