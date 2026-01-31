/**
 * React hooks for checking user permissions on the client side.
 *
 * US-009: Update UI Based on Permissions
 *
 * These hooks allow components to check if the current user has specific
 * permissions within an organization, enabling conditional rendering of
 * UI elements based on user roles.
 */

import { useState, useEffect } from 'react'
import { Permission } from '@/lib/types/rbac.types'

/**
 * Result of a permission check from the API.
 */
interface PermissionCheckResult {
  granted: boolean
  role?: string
  reason?: string
}

/**
 * Options for the usePermission hook.
 */
interface UsePermissionOptions {
  /**
   * Whether to automatically fetch permissions on mount.
   * @default true
   */
  enabled?: boolean
}

/**
 * Hook to check if the current user has a specific permission.
 *
 * This hook fetches the permission status from the server and returns
 * whether the user has the requested permission, along with their role.
 *
 * @param permission - The permission to check
 * @param organizationId - The organization ID to check permissions for
 * @param options - Optional configuration
 * @returns Permission check result with loading state
 *
 * @example
 * ```tsx
 * function DeleteProjectButton({ projectId, organizationId }) {
 *   const { canPerform, isLoading } = usePermission(
 *     Permission.PROJECTS_DELETE,
 *     organizationId
 *   )
 *
 *   if (isLoading) return <Spinner />
 *   if (!canPerform) return null // Hide button for non-owners
 *
 *   return <button onClick={() => deleteProject(projectId)}>Delete</button>
 * }
 * ```
 */
export function usePermission(
  permission: Permission,
  organizationId: string | null | undefined,
  options: UsePermissionOptions = {}
): {
  canPerform: boolean
  isLoading: boolean
  error: string | null
  result: PermissionCheckResult | null
} {
  const { enabled = true } = options
  const [result, setResult] = useState<PermissionCheckResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't fetch if disabled or missing organization ID
    if (!enabled || !organizationId) {
      setResult(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const fetchPermission = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setError('No authentication token found')
          setIsLoading(false)
          return
        }

        const response = await fetch(
          `/api/permissions/check?permission=${encodeURIComponent(permission)}&organizationId=${encodeURIComponent(organizationId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Failed to check permission' }))
          setError(data.error || data.message || 'Failed to check permission')
          setResult({ granted: false })
          setIsLoading(false)
          return
        }

        const data: PermissionCheckResult = await response.json()
        setResult(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check permission'
        setError(message)
        setResult({ granted: false })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermission()
  }, [permission, organizationId, enabled])

  return {
    canPerform: result?.granted ?? false,
    isLoading,
    error,
    result,
  }
}

/**
 * Hook to check multiple permissions at once.
 *
 * This hook fetches all requested permissions and returns a map of
 * permission to whether the user has it.
 *
 * @param permissions - Array of permissions to check
 * @param organizationId - The organization ID to check permissions for
 * @returns Map of permission to granted status, plus loading state
 *
 * @example
 * ```tsx
 * function ProjectActions({ organizationId }) {
 *   const { permissions, isLoading } = usePermissions(
 *     [Permission.PROJECTS_DELETE, Permission.PROJECTS_MANAGE_KEYS],
 *     organizationId
 *   )
 *
 *   if (isLoading) return <Spinner />
 *
 *   return (
 *     <>
 *       {permissions[Permission.PROJECTS_MANAGE_KEYS] && (
 *         <button>Manage Keys</button>
 *       )}
 *       {permissions[Permission.PROJECTS_DELETE] && (
 *         <button>Delete Project</button>
 *       )}
 *     </>
 *   )
 * }
 * ```
 */
export function usePermissions(
  permissions: Permission[],
  organizationId: string | null | undefined
): {
  permissions: Record<Permission, boolean>
  isLoading: boolean
  error: string | null
} {
  const [permissionMap, setPermissionMap] = useState<Record<Permission, boolean>>({} as Record<Permission, boolean>)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || permissions.length === 0) {
      setPermissionMap({} as Record<Permission, boolean>)
      setError(null)
      setIsLoading(false)
      return
    }

    const fetchPermissions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setError('No authentication token found')
          setIsLoading(false)
          return
        }

        // Fetch all permissions in parallel
        const results = await Promise.all(
          permissions.map(async (permission) => {
            const response = await fetch(
              `/api/permissions/check?permission=${encodeURIComponent(permission)}&organizationId=${encodeURIComponent(organizationId)}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            if (!response.ok) {
              return { permission, granted: false }
            }

            const data: PermissionCheckResult = await response.json()
            return { permission, granted: data.granted }
          })
        )

        // Build the permission map
        const map: Record<Permission, boolean> = {} as Record<Permission, boolean>
        for (const result of results) {
          map[result.permission] = result.granted
        }

        setPermissionMap(map)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check permissions'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPermissions()
  }, [permissions.join(','), organizationId])

  return {
    permissions: permissionMap,
    isLoading,
    error,
  }
}
