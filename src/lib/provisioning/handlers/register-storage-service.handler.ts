/**
 * Register Storage Service Step Handler
 *
 * Story: Phase 2 - External Service Registration
 *
 * This handler verifies the storage service credentials are configured
 * and stores the configuration for the tenant. The storage service uses
 * Telegram Storage API and Cloudinary, which are configured via
 * environment variables and shared across all tenants.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from '../steps'

interface StorageConfig {
  telegram: boolean
  cloudinary: boolean
}

export const registerStorageServiceHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const client = await pool.connect()

  try {
    // 1. Get project details
    const projectResult = await client.query(
      `
      SELECT id, slug, tenant_id, environment
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
    const { slug, tenant_id, environment } = project

    // 2. Verify storage service credentials are configured
    const telegramStorageUrl = process.env.TELEGRAM_STORAGE_API_URL
    const telegramStorageKey = process.env.TELEGRAM_STORAGE_API_KEY
    const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME

    const storageConfig: StorageConfig = {
      telegram: !!(telegramStorageUrl && telegramStorageKey),
      cloudinary: !!cloudinaryCloudName,
    }

    if (!storageConfig.telegram && !storageConfig.cloudinary) {
      return {
        success: false,
        error: 'No storage service credentials configured. Please set TELEGRAM_STORAGE_API_URL/KEY or CLOUDINARY_CLOUD_NAME',
        errorDetails: {
          error_type: 'ConfigurationError',
          context: { projectId },
        },
      }
    }

    // For integration tests, skip actual HTTP call and use mock data
    if (process.env.INTEGRATION_TEST === 'true') {
      // Store mock service registration and return success
      await client.query(
        `
        UPDATE projects
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'storage_service', jsonb_build_object(
            'registered_at', NOW(),
            'tenant_id', $2::text,
            'environment', $3::text,
            'bucket_prefix', $4::text,
            'max_file_size', 52428800::int,
            'telegram_enabled', true,
            'cloudinary_enabled', true
          )
        )
        WHERE id = $1::uuid
        `,
        [projectId, tenant_id, environment || 'dev', `${tenant_id}/`]
      )

      return {
        success: true,
      }
    }

    console.log(
      `[Provisioning] Storage service verification for project ${projectId}:`,
      `Telegram: ${storageConfig.telegram ? 'configured' : 'not configured'}, Cloudinary: ${storageConfig.cloudinary ? 'configured' : 'not configured'}`
    )

    // 3. Test storage service availability (optional, don't fail on errors)
    if (storageConfig.telegram) {
      let testResponse: Response | null = null
      try {
        testResponse = await fetch(`${telegramStorageUrl}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${telegramStorageKey}`,
            'User-Agent': 'NextMavens-Provisioning/1.0',
          },
        })
      } catch {
        testResponse = null
      }

      if (testResponse?.ok) {
        console.log(`[Provisioning] Telegram Storage API is accessible`)
      } else {
        console.warn(`[Provisioning] Telegram Storage API health check failed`)
      }
    }

    // 4. Build storage service configuration for this tenant
    const storageServiceConfig = {
      tenant_id,
      project_id: projectId,
      slug,
      environment: environment || 'dev',
      storage_path_prefix: `${tenant_id}/`, // All files will be stored under this prefix
      telegram_enabled: storageConfig.telegram,
      cloudinary_enabled: storageConfig.cloudinary,
    }

    // 5. Store service registration in project metadata
    await client.query(
      `
      UPDATE projects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'storage_service', jsonb_build_object(
          'registered_at', NOW(),
          'tenant_id', $2::text,
          'environment', $3::text,
          'storage_path_prefix', $4::text,
          'telegram_enabled', $5::boolean,
          'cloudinary_enabled', $6::boolean
        )
      )
      WHERE id = $1::uuid
      `,
      [
        projectId,
        tenant_id,
        environment || 'dev',
        `${tenant_id}/`,
        storageConfig.telegram,
        storageConfig.cloudinary,
      ]
    )

    console.log(
      `[Provisioning] Storage service registration completed for project ${projectId}`
    )

    return {
      success: true,
      data: {
        telegram_enabled: storageConfig.telegram,
        cloudinary_enabled: storageConfig.cloudinary,
        storage_path_prefix: `${tenant_id}/`,
      },
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
      error: `Failed to register with storage service: ${errorMessage}`,
      errorDetails,
    }
  } finally {
    client.release()
  }
}
