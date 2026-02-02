/**
 * Studio Permissions Hook
 * Handles RBAC permissions for SQL query execution
 */

import { useState, useEffect } from 'react'
import { Permission } from '@/lib/types/rbac.types'
import type { UserRole } from '../types'

export function useStudioPermissions(projectSlug: string) {
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(true)

  useEffect(() => {
    fetchUserPermissions()
  }, [projectSlug])

  /**
   * Fetch user role and organization ID for RBAC permissions
   * Viewers can only SELECT, Developers can SELECT/INSERT/UPDATE,
   * Admins/Owners have full access
   */
  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem('accessToken')

      // Get project info to find organization ID
      const projectRes = await fetch(`/api/projects?slug=${projectSlug}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!projectRes.ok) {
        return
      }

      const projectData = await projectRes.json()
      const project = projectData.projects?.[0]

      if (!project) {
        return
      }

      // Get organization ID from project
      setOrganizationId(project.tenant_id || null)

      // Fetch user's database.write permission to determine role
      if (project.tenant_id) {
        const permRes = await fetch(
          `/api/permissions/check?permission=${encodeURIComponent(Permission.DATABASE_WRITE)}&organizationId=${encodeURIComponent(project.tenant_id)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (permRes.ok) {
          const permData = await permRes.json()
          setUserRole(permData.role || null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch user permissions:', err)
    } finally {
      setPermissionsLoading(false)
    }
  }

  /**
   * Check if user can execute a specific query based on their role
   * - Viewers: only SELECT
   * - Developers: SELECT, INSERT, UPDATE
   * - Admins/Owners: full access (SELECT, INSERT, UPDATE, DELETE, DDL)
   */
  const canExecuteQuery = (query: string, readonly: boolean): boolean => {
    // If readonly mode is on, only SELECT queries are allowed (for all authenticated users)
    if (readonly) {
      const trimmedQuery = query.trim()
      const command = extractSqlCommand(trimmedQuery)
      return command === 'SELECT'
    }

    // If readonly mode is OFF, check role-based permissions
    if (!userRole) {
      return false // No role = no permission
    }

    const trimmedQuery = query.trim()
    const command = extractSqlCommand(trimmedQuery)

    // Viewers can only SELECT even when readonly is off
    if (userRole === 'viewer') {
      return command === 'SELECT'
    }

    // Developers can SELECT, INSERT, UPDATE (but not DELETE or DDL)
    if (userRole === 'developer') {
      return ['SELECT', 'INSERT', 'UPDATE'].includes(command)
    }

    // Admins and Owners have full access
    if (userRole === 'admin' || userRole === 'owner') {
      return true
    }

    return false
  }

  /**
   * Extract the first SQL command from a query
   */
  const extractSqlCommand = (queryText: string): string => {
    const trimmed = queryText.trim()
    const withoutComments = trimmed
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
    const match = withoutComments.match(/^(\w+)/)
    return match ? match[1].toUpperCase() : ''
  }

  /**
   * Get permission error message for a query
   */
  const getPermissionError = (query: string): string => {
    const command = extractSqlCommand(query.trim())
    if (userRole === 'viewer') {
      return `Viewers can only execute SELECT queries. Your current role '${userRole}' does not permit ${command} operations.`
    }
    if (userRole === 'developer') {
      return `Developers can execute SELECT, INSERT, and UPDATE queries. Your current role '${userRole}' does not permit ${command} operations.`
    }
    return `You do not have permission to execute this query. Your role '${userRole || 'unknown'}' does not permit ${command} operations.`
  }

  return {
    userRole,
    organizationId,
    permissionsLoading,
    canExecuteQuery,
    getPermissionError,
  }
}
