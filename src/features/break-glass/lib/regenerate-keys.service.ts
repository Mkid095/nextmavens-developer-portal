/**
 * Regenerate System Keys Service
 *
 * Service layer for the regenerate keys break glass power.
 * Handles the business logic for invalidating all existing keys and generating new service_role keys.
 *
 * US-007: Implement Regenerate System Keys Power - Step 1: Foundation
 *
 * @example
 * ```typescript
 * import { regenerateKeys } from '@/features/break-glass/lib/regenerate-keys.service';
 *
 * const result = await regenerateKeys({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Key compromise suspected - rotating all keys',
 * });
 *
 * console.log('New keys:', result.keys_state.new_service_role_keys);
 * ```
 */

import { getPool } from '@/lib/db';
import { generateApiKey, hashApiKey } from '@/lib/auth';
import {
  logAdminAction,
  AdminActionType,
  AdminTargetType,
} from './admin-database';
import { logBreakGlassAction } from './aggressive-audit-logger';
import {
  getKeyPrefix,
  DEFAULT_SCOPES,
  mapProjectEnvironmentToKeyEnvironment,
  type ApiKey,
  type ApiKeyEnvironment,
} from '@/lib/types/api-key.types';
import { invalidateSnapshot } from '@/lib/snapshot';
import type {
  RegeneratedKeysState,
  RegenerateKeysActionLog,
  RegenerateKeysResponse,
  RegenerateKeysError,
  InvalidatedKey,
  GeneratedServiceRoleKey,
} from '../types/regenerate-keys.types';

/**
 * Regenerate keys operation parameters
 */
export interface RegenerateKeysParams {
  /** Project ID to regenerate keys for */
  projectId: string;

  /** Break glass session ID */
  sessionId: string;

  /** Admin ID performing the regeneration */
  adminId: string;

  /** Optional reason/context for the regeneration */
  reason?: string;

  /** Whether to invalidate all existing keys (default: true) */
  invalidateAll?: boolean;

  /** Number of service_role keys to generate (default: 1) */
  keyCount?: number;

  /** Environment for new keys (default: 'live') */
  environment?: 'live' | 'test' | 'dev';
}

/**
 * Regenerate system keys for a project using break glass power
 *
 * This operation:
 * 1. Validates the project exists
 * 2. Captures the current key state (before)
 * 3. Invalidates all existing keys if requested
 * 4. Generates new service_role keys
 * 5. Logs the action with before/after states
 *
 * @param params - Regenerate keys operation parameters
 * @returns Result of the regenerate keys operation
 * @throws Error if project not found or database operation fails
 *
 * @example
 * ```typescript
 * const result = await regenerateKeys({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 *   reason: 'Key compromise - rotating all keys',
 *   keyCount: 2,
 * });
 * ```
 */
export async function regenerateKeys(
  params: RegenerateKeysParams
): Promise<RegenerateKeysResponse> {
  const {
    projectId,
    sessionId,
    adminId,
    reason,
    invalidateAll = true,
    keyCount = 1,
    environment = 'live',
  } = params;

  const pool = getPool();

  // Step 1: Get current project state
  const projectResult = await pool.query(
    `
    SELECT
      p.id,
      p.project_name,
      p.status,
      p.tenant_id,
      p.developer_id,
      p.created_at
    FROM projects p
    WHERE p.id = $1
    `,
    [projectId]
  );

  if (projectResult.rows.length === 0) {
    const error: RegenerateKeysError = {
      error: 'Project not found',
      details: `Project with ID ${projectId} does not exist`,
      code: 'PROJECT_NOT_FOUND',
    };
    throw new Error(JSON.stringify(error));
  }

  const project = projectResult.rows[0];

  // Step 2: Get current API keys state
  const keysResult = await pool.query(
    `
    SELECT
      id,
      name,
      key_type,
      key_prefix,
      scopes,
      environment,
      created_at
    FROM api_keys
    WHERE project_id = $1
    ORDER BY created_at DESC
    `,
    [projectId]
  );

  const existingKeys = keysResult.rows as ApiKey[];

  // Capture before state
  const beforeState: Record<string, unknown> = {
    project_id: project.id,
    project_name: project.project_name,
    status: project.status,
    tenant_id: project.tenant_id,
    developer_id: project.developer_id,
    keys_count: existingKeys.length,
    existing_keys: existingKeys.map((key) => ({
      id: key.id,
      name: key.name,
      key_type: key.key_type,
      key_prefix: key.key_prefix,
      environment: key.environment,
      created_at: key.created_at,
    })),
  };

  // Step 3: Invalidate all existing keys if requested
  const invalidatedKeys: InvalidatedKey[] = [];
  if (invalidateAll && existingKeys.length > 0) {
    for (const key of existingKeys) {
      invalidatedKeys.push({
        id: key.id,
        name: key.name || key.key_type,
        key_type: key.key_type,
        key_prefix: key.key_prefix,
        invalidated_at: new Date(),
      });
    }

    // Delete all existing API keys
    await pool.query('DELETE FROM api_keys WHERE project_id = $1', [projectId]);
  }

  // Step 4: Generate new service_role keys
  const newServiceRoleKeys: GeneratedServiceRoleKey[] = [];
  const scopes = DEFAULT_SCOPES.service_role;

  // Map environment to ApiKeyEnvironment type
  const envMapping: Record<string, ApiKeyEnvironment> = {
    live: 'prod',
    test: 'staging',
    dev: 'dev',
  };
  const apiKeyEnv = envMapping[environment] || 'dev';
  const keyPrefix = getKeyPrefix('service_role', apiKeyEnv);

  for (let i = 0; i < keyCount; i++) {
    // Generate a new secret key
    const secretKey = generateApiKey('secret');
    const hashedSecretKey = hashApiKey(secretKey);

    // Generate a public key identifier
    const publicKey = generateApiKey('public');

    // Insert new key into database
    const insertResult = await pool.query(
      `
      INSERT INTO api_keys (project_id, key_type, key_prefix, key_hash, name, scopes, environment)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, key_type, key_prefix, scopes, environment, created_at
      `,
      [
        projectId,
        'service_role',
        keyPrefix,
        hashedSecretKey,
        `Service Role Key ${i + 1} (Regenerated ${new Date().toISOString()})`,
        JSON.stringify(scopes),
        apiKeyEnv,
      ]
    );

    const newKey = insertResult.rows[0];

    newServiceRoleKeys.push({
      id: newKey.id,
      key_type: 'service_role',
      key_prefix: newKey.key_prefix,
      secret_key: `${newKey.key_prefix}${secretKey}`,
      scopes: newKey.scopes,
      environment: newKey.environment,
      created_at: newKey.created_at,
      show_once_warning:
        'IMPORTANT: Save this key now. You will not be able to see it again.',
    });
  }

  // Invalidate snapshot cache for this project
  invalidateSnapshot(projectId);

  // Capture after state
  const afterState: Record<string, unknown> = {
    project_id: project.id,
    project_name: project.project_name,
    previous_status: project.status,
    keys_invalidated: invalidatedKeys.length,
    new_keys_generated: newServiceRoleKeys.length,
    invalidated_keys: invalidatedKeys,
    new_keys_count: newServiceRoleKeys.length,
    environment,
    regenerated_at: new Date().toISOString(),
    admin_reason: reason || null,
  };

  // Step 5: Log the admin action to BOTH admin_actions AND audit_logs (aggressive logging)
  const action = await logBreakGlassAction({
    adminId,
    sessionId,
    action: AdminActionType.REGENERATE_KEYS,
    targetType: AdminTargetType.API_KEY,
    targetId: projectId,
    beforeState,
    afterState,
    metadata: {
      reason: reason || 'No reason provided',
      project_name: project.project_name,
      keys_invalidated: invalidatedKeys.length,
      new_keys_generated: newServiceRoleKeys.length,
      environment,
    },
    projectId,
    developerId: adminId,
  });

  // Step 6: Build response
  const keysState: RegeneratedKeysState = {
    project_id: project.id,
    project_name: project.project_name,
    keys_invalidated: invalidatedKeys.length,
    invalidated_keys: invalidatedKeys,
    new_keys_generated: newServiceRoleKeys.length,
    new_service_role_keys: newServiceRoleKeys,
    regenerated_at: new Date(),
  };

  const actionLog: RegenerateKeysActionLog = {
    id: action.id,
    session_id: action.session_id,
    action: action.action,
    target_type: action.target_type,
    target_id: action.target_id as string,
    before_state: action.before_state as Record<string, unknown>,
    after_state: action.after_state as Record<string, unknown>,
    logged_at: action.created_at,
  };

  const response: RegenerateKeysResponse = {
    success: true,
    project: {
      id: project.id,
      name: project.project_name,
    },
    keys_state: keysState,
    action_log: actionLog,
  };

  // Add warning if no keys were invalidated
  if (invalidateAll && existingKeys.length === 0) {
    response.warning =
      'Project had no existing keys to invalidate. New service_role keys were generated.';
  }

  return response;
}

/**
 * Get regenerate keys operation history for a project
 *
 * @param projectId - Project ID to query
 * @returns Array of regenerate keys actions performed on this project
 *
 * @example
 * ```typescript
 * const history = await getRegenerateKeysHistory('proj-123');
 * console.log('Regenerate keys operations:', history.length);
 * ```
 */
export async function getRegenerateKeysHistory(
  projectId: string
): Promise<RegenerateKeysActionLog[]> {
  const pool = getPool();

  const result = await pool.query(
    `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.before_state,
      aa.after_state,
      aa.created_at
    FROM control_plane.admin_actions aa
    WHERE aa.action = $1
      AND aa.target_type = 'api_key'
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
    `,
    [AdminActionType.REGENERATE_KEYS, projectId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    session_id: row.session_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    before_state: row.before_state as Record<string, unknown>,
    after_state: row.after_state as Record<string, unknown>,
    logged_at: row.created_at,
  }));
}

/**
 * Validate regenerate keys request parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with any errors
 *
 * @example
 * ```typescript
 * const validation = validateRegenerateKeysRequest({
 *   projectId: 'proj-123',
 *   sessionId: 'session-456',
 *   adminId: 'admin-789',
 * });
 *
 * if (!validation.valid) {
 *   return NextResponse.json(
 *     { errors: validation.errors },
 *     { status: 400 }
 *   );
 * }
 * ```
 */
export function validateRegenerateKeysRequest(
  params: Partial<RegenerateKeysParams>
): { valid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];

  if (!params.projectId || typeof params.projectId !== 'string') {
    errors.push({
      field: 'projectId',
      message: 'Project ID is required and must be a string',
    });
  }

  if (!params.sessionId || typeof params.sessionId !== 'string') {
    errors.push({
      field: 'sessionId',
      message: 'Session ID is required and must be a string',
    });
  }

  if (!params.adminId || typeof params.adminId !== 'string') {
    errors.push({
      field: 'adminId',
      message: 'Admin ID is required and must be a string',
    });
  }

  if (params.keyCount !== undefined) {
    if (
      typeof params.keyCount !== 'number' ||
      params.keyCount < 1 ||
      params.keyCount > 10
    ) {
      errors.push({
        field: 'keyCount',
        message: 'Key count must be a number between 1 and 10',
      });
    }
  }

  if (params.environment !== undefined) {
    const validEnvironments = ['live', 'test', 'dev'];
    if (!validEnvironments.includes(params.environment)) {
      errors.push({
        field: 'environment',
        message: `Environment must be one of: ${validEnvironments.join(', ')}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
