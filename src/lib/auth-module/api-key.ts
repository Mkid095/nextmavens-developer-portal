/**
 * Authentication Library - API Key Authentication
 *
 * US-004: Update Key Usage on Each Request
 * US-009: Track Key Usage - usage_stats table tracks request count
 */

import { getPool } from '@/lib/db'
import { createError, ErrorCode } from '@/lib/errors'
import { checkProjectStatus } from './project-status'
import type { ApiKeyAuth } from './types'
import { logApiUsage } from '@/lib/key-usage-tracking'

/**
 * Authenticate an API key and return the key details with developer info.
 * Updates last_used and usage_count asynchronously after successful authentication.
 *
 * US-004: Update Key Usage on Each Request
 *
 * @param apiKey - The raw API key from the request (e.g., from x-api-key header)
 * @returns The API key details with developer_id
 * @throws PlatformError with KEY_INVALID code if the key is invalid, expired, or revoked
 */
export async function authenticateApiKey(apiKey: string): Promise<ApiKeyAuth> {
  const pool = getPool()
  const { hashApiKey } = await import('./utils')
  const hashedKey = hashApiKey(apiKey)

  // Query for the API key with developer ownership
  const result = await pool.query(
    `SELECT ak.id, ak.project_id, p.developer_id, ak.key_type, ak.key_prefix,
            ak.scopes, ak.environment, ak.name, ak.created_at, ak.status, ak.expires_at
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

  // US-007: Enforce Status Checks at Gateway
  // Check project status and throw error if keys don't work for this status
  await checkProjectStatus(key.project_id)

  // Update last_used and usage_count asynchronously (fire and forget)
  // This ensures we don't block the request waiting for the update
  updateKeyUsage(key.id).catch(error => {
    console.error('[Auth] Failed to update key usage:', error)
  })

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
  }
}

/**
 * Update key usage statistics (last_used timestamp and usage_count).
 * This is called asynchronously after successful authentication.
 *
 * US-009: Track Key Usage - last_used column updated on each use
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
    console.error(`[Auth] Failed to update usage for key ${keyId}:`, error)
    throw error
  }
}

/**
 * Log API key usage with request details.
 * This should be called after processing an API request to track usage statistics.
 *
 * US-009: Track Key Usage - usage_stats table tracks request count
 *
 * @param keyId - The API key ID
 * @param projectId - The project ID
 * @param endpoint - The API endpoint that was called
 * @param method - The HTTP method
 * @param statusCode - The HTTP status code returned
 * @param responseTimeMs - Optional response time in milliseconds
 */
export async function logApiKeyUsage(
  keyId: string,
  projectId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs?: number
): Promise<void> {
  // Log asynchronously to avoid blocking the response
  logApiUsage({
    key_id: keyId,
    project_id: projectId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTimeMs,
  }).catch(error => {
    console.error('[Auth] Failed to log API key usage:', error)
  })
}
