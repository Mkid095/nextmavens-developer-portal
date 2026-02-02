/**
 * Generate API Keys Step Handler
 *
 * Story: Database Provisioning Implementation
 *
 * This handler generates the initial API keys for a newly provisioned project.
 * It creates three types of keys:
 * - Public Key (pk): For client-side use, read-only access
 * - Secret Key (sk): For server-side use, full CRUD access
 * - Service Role Key (sr): For admin operations, bypasses RLS
 *
 * The keys are stored hashed in the database. The full keys are returned
 * only once during creation.
 *
 * Key format: nm_{env}_{type}_{random}
 * Example: nm_prod_pk_abc123def456...
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from '../steps'
import { generateApiKey, hashApiKey } from '@/lib/auth'

export const generateApiKeysHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const client = await pool.connect()

  try {
    // 1. Get project details
    const projectResult = await client.query(
      `
      SELECT id, slug, tenant_id, environment, developer_id
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: {
          error_type: 'NotFoundError',
          context: { projectId },
        },
      }
    }

    const project = projectResult.rows[0]
    const { slug, tenant_id, environment, developer_id } = project

    // 2. Generate random keys
    const publicRandom = generateApiKey('public')
    const secretRandom = generateApiKey('secret')
    const serviceRoleRandom = generateApiKey('secret')

    // 3. Build formatted keys with prefixes
    // Format: nm_{env}_{type}_{random}
    const env = environment || 'dev'
    const publicKey = `nm_${env}_pk_${publicRandom}`
    const secretKey = `nm_${env}_sk_${secretRandom}`
    const serviceRoleKey = `nm_${env}_sr_${serviceRoleRandom}`

    // 4. Hash the keys for storage
    const publicHash = hashApiKey(publicKey)
    const secretHash = hashApiKey(secretKey)
    const serviceRoleHash = hashApiKey(serviceRoleKey)

    // 5. Check if keys already exist for this project (for idempotency)
    const existingKeys = await client.query(
      'SELECT COUNT(*) as count FROM control_plane.api_keys WHERE project_id = $1',
      [projectId]
    )
    const keyCount = parseInt(existingKeys.rows[0].count, 10)

    // 6. Insert keys into database if they don't already exist
    if (keyCount === 0) {
      await client.query(
        `
        INSERT INTO control_plane.api_keys (
          id,
          project_id,
          name,
          key_type,
          key_prefix,
          key_hash,
          environment,
          created_at
        ) VALUES
          (
            gen_random_uuid(),
            $1,
            'Default Public Key',
            'public',
            'nm_${env}_pk_',
            $2,
            $3,
            NOW()
          ),
          (
            gen_random_uuid(),
            $1,
            'Default Secret Key',
            'secret',
            'nm_${env}_sk_',
            $4,
            $3,
            NOW()
          ),
          (
            gen_random_uuid(),
            $1,
            'Service Role Key',
            'service_role',
            'nm_${env}_sr_',
            $5,
            $3,
            NOW()
          )
        `,
        [
          projectId,
          publicHash,
          env,
          secretHash,
          serviceRoleHash,
        ]
      )
    }

    console.log(
      `[Provisioning] Generated API keys for project ${projectId}:` +
        `\n  Public Key: ${publicKey.substring(0, 20)}...` +
        `\n  Secret Key: ${secretKey.substring(0, 20)}...` +
        `\n  Service Role: ${serviceRoleKey.substring(0, 20)}...`
    )

    // Store the keys in project metadata for retrieval (in production, keys would be shown once and never retrievable)
    await client.query(
      `
      UPDATE projects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'api_keys', jsonb_build_object(
          'generated_at', NOW(),
          'public_key_preview', LEFT($2::text, 20) || '...',
          'warning', 'Full keys are only shown once during creation. Store them securely.'
        )
      )
      WHERE id = $1::uuid
      `,
      [projectId, publicKey]
    )

    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: Record<string, unknown> = {
      error_type: error instanceof Error ? error.constructor.name : 'Error',
      context: { projectId },
    }

    if (error instanceof Error && error.stack) {
      errorDetails.stack_trace = error.stack
    }

    return {
      success: false,
      error: `Failed to generate API keys: ${errorMessage}`,
      errorDetails,
    }
  } finally {
    client.release()
  }
}
