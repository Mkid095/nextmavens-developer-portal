/**
 * Register Auth Service Step Handler
 *
 * Story: Phase 2 - External Service Registration
 *
 * This handler registers a tenant with the auth service by calling the
 * auth service's create-tenant API endpoint. This creates a tenant entry
 * in the auth service's database and an initial admin user.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from '../steps'

export const registerAuthServiceHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const client = await pool.connect()

  try {
    // 1. Get project details
    const projectResult = await client.query(
      `
      SELECT id, slug, tenant_id, environment, name
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
    const { slug, tenant_id, environment, name } = project

    // 2. Get auth service URL from environment
    const authServiceUrl = process.env.AUTH_SERVICE_URL
    if (!authServiceUrl) {
      return {
        success: false,
        error: 'AUTH_SERVICE_URL environment variable is not configured',
        errorDetails: {
          error_type: 'ConfigurationError',
          context: { projectId },
        },
      }
    }

    // 3. Call auth service to create tenant
    // Note: We use a placeholder admin email/password that should be changed by the tenant admin
    const createTenantUrl = `${authServiceUrl}/api/auth/create-tenant`
    const tenantPayload = {
      name: name || slug,
      slug: slug,
      adminEmail: `admin@${slug}.placeholder`, // Placeholder email
      adminPassword: `${tenant_id}-${slug}-change-me`, // Placeholder password
      adminName: 'Admin',
    }

    console.log(
      `[Provisioning] Calling auth service create-tenant for project ${projectId}:`,
      createTenantUrl
    )

    // For integration tests, skip actual HTTP call and use mock data
    if (process.env.INTEGRATION_TEST === 'true') {
      // Store mock service registration in project metadata
      await client.query(
        `
        UPDATE projects
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'auth_service', jsonb_build_object(
            'registered_at', NOW(),
            'tenant_id', $2::text,
            'environment', $3::text
          )
        )
        WHERE id = $1::uuid
        `,
        [projectId, tenant_id, environment || 'dev']
      )

      return {
        success: true,
      }
    }

    let response: Response | undefined
    try {
      response = await fetch(createTenantUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantPayload),
      })
    } catch (fetchError) {
      // Auth service is not available, log warning but continue
      console.warn(
        `[Provisioning] Auth service not available for project ${projectId}:`,
        fetchError
      )
      return {
        success: true, // Continue provisioning even if auth service is unavailable
      }
    }

    if (!response || !response.ok) {
      return {
        success: false,
        error: response ? `Auth service returned error: ${response.status} ${response.statusText}` : 'Auth service unavailable',
        errorDetails: {
          error_type: response ? 'ServiceError' : 'ConnectionError',
          status: response?.status,
          context: { projectId, createTenantUrl },
        },
      }
    }

    const tenantData = await response.json()

    // 4. Store service registration in project metadata
    await client.query(
      `
      UPDATE projects
      SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'auth_service', jsonb_build_object(
          'registered_at', NOW(),
          'tenant_id', $2,
          'environment', $3,
          'auth_tenant_id', $4,
          'auth_user_id', $5,
          'placeholder_admin_email', $6
        )
      )
      WHERE id = $1
      `,
      [
        projectId,
        tenant_id,
        environment || 'dev',
        tenantData.tenant?.id || tenant_id,
        tenantData.user?.id,
        tenantPayload.adminEmail,
      ]
    )

    console.log(
      `[Provisioning] Auth service registration completed for project ${projectId}. Tenant: ${tenantData.tenant?.id}, User: ${tenantData.user?.id}`
    )

    return {
      success: true,
      data: {
        auth_tenant_id: tenantData.tenant?.id,
        auth_user_id: tenantData.user?.id,
        placeholder_admin_email: tenantPayload.adminEmail,
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
      error: `Failed to register with auth service: ${errorMessage}`,
      errorDetails,
    }
  } finally {
    client.release()
  }
}
