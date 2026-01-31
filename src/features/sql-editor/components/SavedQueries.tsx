'use client'

import { useEffect, useState } from 'react'
import {
  Bookmark,
  Trash2,
  Clock,
  X,
  FolderOpen,
} from 'lucide-react'

/**
 * Saved Query Interface
 * US-010: Save Queries
 */
export interface SavedQuery {
  id: string
  name: string
  query: string
  createdAt: number
}

const STORAGE_KEY = 'sql-saved-queries'
const MAX_SAVED_QUERIES = 100

/**
 * Save a query to localStorage with a given name
 */
export function saveQuery(query: string, name: string): SavedQuery {
  const savedQueries = getSavedQueries()

  const newQuery: SavedQuery = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: name.trim() || `Query ${savedQueries.length + 1}`,
    query: query.trim(),
    createdAt: Date.now(),
  }

  // Add to the beginning of the array
  savedQueries.unshift(newQuery)

  // Keep only the most recent MAX_SAVED_QUERIES
  if (savedQueries.length > MAX_SAVED_QUERIES) {
    savedQueries.splice(MAX_SAVED_QUERIES)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQueries))

  return newQuery
}

/**
 * Get all saved queries from localStorage
 */
export function getSavedQueries(): SavedQuery[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const queries = JSON.parse(stored) as SavedQuery[]
    return queries || []
  } catch {
    return []
  }
}

/**
 * Delete a saved query by ID
 */
export function deleteSavedQuery(id: string): void {
  const savedQueries = getSavedQueries()
  const filtered = savedQueries.filter(q => q.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * Format timestamp as relative time
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else if (days < 7) {
    return `${days}d ago`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}

/**
 * Extract SQL command badge from query
 */
function extractSqlCommand(query: string): string {
  const trimmed = query.trim()
  const withoutComments = trimmed
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
  const match = withoutComments.match(/^(\w+)/)
  return match ? match[1].toUpperCase() : ''
}

interface SavedQueriesPanelProps {
  onSelectQuery?: (query: string) => void
  className?: string
}

/**
 * SavedQueriesPanel Component
 * US-010: Save Queries
 *
 * Displays saved queries with the ability to:
 * - View all saved queries
 * - Click to load a query into the editor
 * - Delete saved queries
 * - Show query name, timestamp, and SQL command badge
 */
export function SavedQueriesPanel({
  onSelectQuery,
  className = '',
}: SavedQueriesPanelProps) {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Load saved queries on mount
  useEffect(() => {
    loadSavedQueries()
  }, [])

  /**
   * Load saved queries from localStorage
   */
  const loadSavedQueries = () => {
    const queries = getSavedQueries()
    setSavedQueries(queries)
  }

  /**
   * Handle selecting a saved query
   */
  const handleSelectQuery = (savedQuery: SavedQuery) => {
    if (onSelectQuery) {
      onSelectQuery(savedQuery.query)
    }
  }

  /**
   * Handle deleting a saved query
   */
  const handleDeleteQuery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the select query handler
    if (confirm('Are you sure you want to delete this saved query?')) {
      deleteSavedQuery(id)
      loadSavedQueries()
    }
  }

  /**
   * Filter saved queries by search term
   */
  const filteredQueries = savedQueries.filter(q => {
    const searchLower = searchQuery.toLowerCase()
    return (
      q.name.toLowerCase().includes(searchLower) ||
      q.query.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className={`flex flex-col h-full bg-white border border-slate-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Saved Queries
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {savedQueries.length} / {MAX_SAVED_QUERIES}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search saved queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Query List */}
      <div className="flex-1 overflow-y-auto">
        {filteredQueries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <FolderOpen className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 text-center">
              {searchQuery
                ? 'No saved queries match your search'
                : 'No saved queries yet'}
            </p>
            {!searchQuery && (
              <p className="text-xs text-slate-400 mt-1 text-center">
                Click the "Save" button to store your queries
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQueries.map((savedQuery) => (
              <button
                key={savedQuery.id}
                onClick={() => handleSelectQuery(savedQuery)}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Query name */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {savedQuery.name}
                      </span>
                      {/* SQL command badge */}
                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded font-medium">
                        {extractSqlCommand(savedQuery.query)}
                      </span>
                    </div>

                    {/* Query preview */}
                    <p className="text-xs text-slate-500 line-clamp-2 mb-1">
                      {savedQuery.query}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(savedQuery.createdAt)}</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteQuery(savedQuery.id, e)}
                    className="flex-shrink-0 p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Delete saved query"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
