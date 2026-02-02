/**
 * Results Table Types
 */

export interface QueryResult {
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  executionTime: number
  rowsAffected?: number
  queryPlan?: any
}

export interface ResultsTableProps {
  result: QueryResult | null
  isLoading?: boolean
  error?: string | null
  pageSize?: number
}

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: string | null
  direction: SortDirection
}
