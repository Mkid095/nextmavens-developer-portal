/**
 * Gateway Status Check Enforcement
 *
 * Integrates project status checks with API key authentication.
 * Ensures that suspended, archived, or deleted projects cannot make API requests.
 *
 * US-007: Enforce Status Checks at Gateway
 * - Gateway checks project status on each request
 * - SUSPENDED returns PROJECT_SUSPENDED error
 * - ARCHIVED returns PROJECT_ARCHIVED error
 * - DELETED returns PROJECT_DELETED error
 * - Keys don't work for non-active states
 *
 * @see docs/prd-project-lifecycle.json US-007
 * @see docs/prd-api-gateway-enforcement.json US-002: Validate Project Status
 */

import { createError, ErrorCode } from './errors'
import { ProjectStatus } from './types/project-lifecycle.types'
import type { ApiKeyAuth } from './auth'
import { getPool } from './db'
import { hashApiKey } from './auth'

/**
 * Status check result
 */
interface StatusCheckResult {
  allowed: boolean
  error?: ReturnType<typeof createError>
}

/**
 * Extended API key auth result with project status
 */
export interface AuthenticatedApiKey extends ApiKeyAuth {
  project_status: ProjectStatus
}

/**
 * Get project status from database
 * This is called during API key authentication to ensure the project is active
 *
 * @param projectId - Project ID to check
 * @returns Project status or null if project not found
 */
async function getProjectStatus(projectId: string): Promise<ProjectStatus | null> {
  const pool = getPool()

  try {
    const result = await pool.query(
      `SELECT status FROM projects WHERE id = $1`,
      [projectId]
    )

    if (result.rows.length === 0) {
      return null
    }

    // Database stores status as lowercase, convert to ProjectStatus enum
    return result.rows[0].status as ProjectStatus
  } catch (error) {
    console.error(`[Gateway Status Check] Failed to get project status for ${projectId}:`, error)
    return null
  }
}

/**
 * Check if a project status allows API key authentication
 *
 * @param status - Project status to check
 * @returns Status check result
 */
function checkStatusAllowed(status: ProjectStatus): StatusCheckResult {
  switch (status) {
    case ProjectStatus.CREATED:
    case ProjectStatus.ACTIVE:
      // These statuses allow API key authentication
      return { allowed: true }

    case ProjectStatus.SUSPENDED:
      return {
        allowed: false,
        error: createError(
          ErrorCode.PROJECT_SUSPENDED,
          'Project is suspended. API keys are disabled and services are stopped.',
          undefined,
          { status: 'suspended' }
        ),
      }

    case ProjectStatus.ARCHIVED:
      return {
        allowed: false,
        error: createError(
          ErrorCode.PROJECT_ARCHIVED,
          'Project is archived. Data is read-only and services are disabled.',
          undefined,
          { status: 'archived' }
        ),
      }

    case ProjectStatus.DELETED:
      return {
        allowed: false,
        error: createError(
          ErrorCode.PROJECT_DELETED,
          'Project is deleted and pending permanent removal.',
          undefined,
          { status: 'deleted' }
        ),
      }

    default:
      // Unknown status - fail closed
      return {
        allowed: false,
        error: createError(
          ErrorCode.PROJECT_SUSPENDED,
          'Project status unknown. Access denied.',
          undefined,
          { status: 'unknown' }
        ),
      }
  }
}

/**
 * Authenticate an API key and enforce project status checks
 *
 * This function:
 * 1. Validates the API key (hash, status, expiration)
 * 2. Fetches the project status from the database
 * 3. Checks if the project status allows API access
 * 4. Returns the authenticated key details with project status
 *
 * US-007: Enforce Status Checks at Gateway
 *
 * @param apiKey - The raw API key from the request
 * @returns Authenticated API key with project status
 * @throws PlatformError if key is invalid, expired, revoked, or project status doesn't allow access
 */
export async function authenticateApiKeyWithStatusCheck(
  apiKey: string
): Promise<AuthenticatedApiKey> {
  const pool = getPool()
  const hashedKey = hashApiKey(apiKey)

  try {
    // Query for the API key with project and developer ownership
    const result = await pool.query(
      `SELECT ak.id, ak.project_id, p.developer_id, p.status as project_status,
              ak.key_type, ak.key_prefix, ak.scopes, ak.environment,
              ak.name, ak.created_at, ak.status, ak.expires_at
       FROM api_keys ak
       JOIN projects p ON ak.project_id = p.id
       WHERE ak.key_hash = $1`,
      [hashedKey]
    )

    if (result.rows.length === 0) {
      throw createError(ErrorCode.KEY_INVALID, 'Invalid API key')
    }

    const key = result.rows[0]

    // Check if key is revoked
    if (key.status === 'revoked') {
      throw createError(ErrorCode.KEY_INVALID, 'API key has been revoked')
    }

    // Check if key is expired
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      throw createError(ErrorCode.KEY_INVALID, 'API key has expired')
    }

    // Get project status from database
    const projectStatus = key.project_status as ProjectStatus

    // Check if project status allows API key authentication
    const statusCheck = checkStatusAllowed(projectStatus)

    if (!statusCheck.allowed) {
      // Throw the status-specific error
      throw statusCheck.error!
    }

    // Update last_used and usage_count asynchronously (fire and forget)
    updateKeyUsage(key.id).catch(error => {
      console.error('[Gateway Status Check] Failed to update key usage:', error)
    })

    // Return authenticated key with project status
    return {
      id: key.id,
      project_id: key.project_id,
      developer_id: key.developer_id,
      key_type: key.key_type,
      key_prefix: key.key_prefix,
      scopes: key.scopes || [],
      environment: key.environment,
      name: key.name || key.key_type + ' key',
      created_at: key.created_at,
      project_status: projectStatus,
    }
  } catch (error) {
    // Re-throw PlatformError
    if (error instanceof Error && error.name === 'PlatformError') {
      throw error
    }

    // Wrap other errors
    console.error('[Gateway Status Check] Unexpected error:', error)
    throw createError(ErrorCode.INTERNAL_ERROR, 'Authentication failed')
  }
}

/**
 * Validate project status for an authenticated request
 *
 * This function can be called after authentication to double-check
 * that the project status hasn't changed (e.g., project was suspended
 * after the API key was authenticated).
 *
 * @param projectId - Project ID to validate
 * @returns true if project status allows access, false otherwise
 */
export async function validateProjectStatus(projectId: string): Promise<boolean> {
  const status = await getProjectStatus(projectId)

  if (!status) {
    return false
  }

  const check = checkStatusAllowed(status)
  return check.allowed
}

/**
 * Get the error code for a project status
 *
 * Returns the appropriate error code for a non-active project status
 *
 * @param status - Project status
 * @returns Error code or undefined if status is active
 */
export function getStatusCodeForStatus(status: ProjectStatus): ErrorCode | undefined {
  const check = checkStatusAllowed(status)
  return check.error?.code
}

/**
 * Update key usage statistics (last_used timestamp and usage_count)
 * This is called asynchronously after successful authentication
 *
 * @param keyId - The ID of the API key to update
 */
async function updateKeyUsage(keyId: string): Promise<void> {
  const pool = getPool()

  try {
    await pool.query(
      `UPDATE api_keys
       SET last_used = NOW(),
           usage_count = COALESCE(usage_count, 0) + 1
       WHERE id = $1`,
      [keyId]
    )
  } catch (error) {
    console.error(`[Gateway Status Check] Failed to update usage for key ${keyId}:`, error)
    throw error
  }
}
