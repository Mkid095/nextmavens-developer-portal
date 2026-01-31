/**
 * SQL Editor Feature
 *
 * Monaco-based SQL editor component for Studio.
 *
 * US-001: Create SQL Editor Component
 * US-003: Create Results Table Component
 * US-004: Implement Query History
 * US-010: Save Queries
 */

export { SqlEditor } from './components/SqlEditor'
export { ResultsTable } from './components/ResultsTable'
export { QueryHistoryPanel, useQueryHistory, addQueryToHistory } from './components/QueryHistory'
export { SavedQueriesPanel, saveQuery, getSavedQueries, deleteSavedQuery } from './components/SavedQueries'
export type { QueryResult } from './components/ResultsTable'
export type { QueryHistoryItem } from './components/QueryHistory'
export type { SavedQuery } from './components/SavedQueries'
