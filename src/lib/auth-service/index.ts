/**
 * Auth Service Module
 *
 * Exports all auth service snapshot consumer functionality.
 */

export * from './snapshot-client'

/**
 * Auth Service Snapshot Gateway
 *
 * Provides a high-level API for checking auth operation permissions
 * based on control plane snapshot state.
 *
 * All methods implement fail-closed behavior:
 * - Return false (deny) when snapshot is unavailable
 * - Return false (deny) when project is not active
 * - Return false (deny) when auth service is not enabled
 */

import {
  canPerformAuthOperation,
  isProjectActive,
  isAuthServiceEnabled,
} from './snapshot-client'

/**
 * Check if a user sign-in operation is allowed
 * @param projectId - Project ID to check
 * @returns true if sign-in is allowed
 */
export async function canSignIn(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a user sign-up operation is allowed
 * @param projectId - Project ID to check
 * @returns true if sign-up is allowed
 */
export async function canSignUp(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a token refresh operation is allowed
 * @param projectId - Project ID to check
 * @returns true if token refresh is allowed
 */
export async function canRefreshToken(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a user metadata operation is allowed
 * @param projectId - Project ID to check
 * @returns true if metadata operation is allowed
 */
export async function canUpdateMetadata(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a session management operation is allowed
 * @param projectId - Project ID to check
 * @returns true if session operation is allowed
 */
export async function canManageSessions(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a user query operation is allowed
 * @param projectId - Project ID to check
 * @returns true if query is allowed
 */
export async function canQueryUser(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a user disable operation is allowed
 * @param projectId - Project ID to check
 * @returns true if disable is allowed
 */
export async function canDisableUser(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a user enable operation is allowed
 * @param projectId - Project ID to check
 * @returns true if enable is allowed
 */
export async function canEnableUser(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Check if a password reset operation is allowed
 * @param projectId - Project ID to check
 * @returns true if password reset is allowed
 */
export async function canResetPassword(projectId: string): Promise<boolean> {
  return canPerformAuthOperation(projectId)
}

/**
 * Get project status information
 * @param projectId - Project ID to check
 * @returns Project status or null if unavailable
 */
export async function getProjectStatus(
  projectId: string
): Promise<'ACTIVE' | 'CREATED' | 'SUSPENDED' | 'ARCHIVED' | 'DELETED' | null> {
  const snapshot = await (await import('./snapshot-client')).authServiceSnapshotClient.getSnapshot(projectId)

  if (!snapshot) {
    return null
  }

  return snapshot.project.status
}

/**
 * Get auth service enablement status
 * @param projectId - Project ID to check
 * @returns true if enabled, false if disabled, null if unavailable
 */
export async function getAuthServiceEnablement(
  projectId: string
): Promise<boolean | null> {
  const snapshot = await (await import('./snapshot-client')).authServiceSnapshotClient.getSnapshot(projectId)

  if (!snapshot) {
    return null
  }

  return snapshot.services.auth?.enabled ?? false
}
