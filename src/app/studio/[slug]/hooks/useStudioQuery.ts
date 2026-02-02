/**
 * Studio Query Hook
 * Handles SQL query execution
 */

import { useState } from 'react'
import { addQueryToHistory } from '@/features/sql-editor/components/QueryHistory'

export function useStudioQuery(projectSlug: string, canExecuteQuery: (query: string, readonly: boolean) => boolean, getPermissionError: (query: string) => string) {
  const [sqlQuery, setSqlQuery] = useState('')
  const [queryResults, setQueryResults] = useState<any>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  /**
   * Execute SQL query with readonly mode
   * Enforce RBAC permissions for SQL execution
   * - Viewers can only SELECT
   * - Developers can SELECT/INSERT/UPDATE
   * - Admins/Owners have full access
   * Add query to history after successful execution
   * Support explain mode for query plan analysis
   */
  const handleExecuteQuery = async (query: string, readonly: boolean, explain?: boolean) => {
    // Check if user can execute this query based on their role
    if (!canExecuteQuery(query, readonly)) {
      setQueryError(getPermissionError(query))
      return
    }

    setIsExecuting(true)
    setQueryError(null)
    setQueryResults(null)

    try {
      const token = localStorage.getItem('accessToken')
      // First, get the project ID from the slug
      const projectRes = await fetch(`/api/projects?slug=${projectSlug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!projectRes.ok) {
        throw new Error('Failed to get project info')
      }

      const projectData = await projectRes.json()
      const projectId = projectData.projects?.[0]?.id

      if (!projectId) {
        throw new Error('Project not found')
      }

      // Execute query with readonly and explain parameters
      const res = await fetch(`/api/studio/${projectId}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, readonly, explain }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Handle validation errors for readonly mode
        if (data.error) {
          setQueryError(data.error)
        } else {
          setQueryError('Query execution failed')
        }
        return
      }

      if (data.success) {
        setQueryResults(data.data)
        // Add successful query to history
        addQueryToHistory(query, readonly)
      }
    } catch (err: unknown) {
      console.error('Query execution failed:', err)
      const message = err instanceof Error ? err.message : 'Query execution failed'
      setQueryError(message)
    } finally {
      setIsExecuting(false)
    }
  }

  return {
    sqlQuery,
    setSqlQuery,
    queryResults,
    queryError,
    isExecuting,
    handleExecuteQuery,
  }
}
