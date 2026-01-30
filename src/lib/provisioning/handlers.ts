/**
 * Provisioning Step Handlers
 *
 * Implementation of individual provisioning step handlers.
 * Each handler performs a specific provisioning operation.
 *
 * Story: US-008 - Implement Verify Services Step
 * PRD: Provisioning State Machine
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from './steps'

/**
 * Service health check result
 */
interface ServiceHealthResult {
  serviceName: string
  healthy: boolean
  latency?: number
  error?: string
}

/**
 * Perform health check on a service endpoint
 *
 * @param endpoint - The service endpoint to check
 * @param timeout - Request timeout in milliseconds
 * @returns Service health result
 */
async function checkServiceHealth(
  endpoint: string,
  timeout: number = 5000
): Promise<ServiceHealthResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'NextMavens-Provisioning/1.0',
      },
    })

    clearTimeout(timeoutId)
    const latency = Date.now() - startTime

    if (response.ok) {
      return {
        serviceName: endpoint,
        healthy: true,
        latency,
      }
    }

    return {
      serviceName: endpoint,
      healthy: false,
      latency,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : String(error)

    return {
      serviceName: endpoint,
      healthy: false,
      latency,
      error: errorMessage,
    }
  }
}

/**
 * Verify Services Step Handler
 *
 * Story: US-008 - Implement Verify Services Step
 *
 * This handler verifies that all required services are healthy
 * after provisioning. It pings each service endpoint and checks
 * their health status.
 *
 * Services checked:
 * - Database (via connection test)
 * - Auth service (via health endpoint)
 * - Realtime service (via health endpoint)
 * - Storage service (via health endpoint)
 * - GraphQL service (via health endpoint)
 *
 * The step marks success only if all services are ready.
 * Fails the step if any service is unavailable.
 *
 * @param projectId - The project ID being provisioned
 * @param pool - Database connection pool
 * @returns Step execution result
 */
export const verifyServicesHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const healthResults: ServiceHealthResult[] = []
  const errors: string[] = []

  try {
    // 1. Get project details to determine service endpoints
    const projectResult = await pool.query(
      `
      SELECT
        p.id,
        p.slug,
        p.tenant_id,
        p.status,
        p.environment,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'service_type', ps.service_type,
              'enabled', ps.enabled
            ) ORDER BY ps.service_type
          ) FILTER (WHERE ps.service_type IS NOT NULL),
          '[]'::jsonb
        ) as services
      FROM projects p
      LEFT JOIN project_services ps ON ps.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, p.slug, p.tenant_id, p.status, p.environment
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
    const services = project.services || []

    // 2. Check database connectivity
    try {
      const dbStartTime = Date.now()
      await pool.query('SELECT 1')
      const dbLatency = Date.now() - dbStartTime

      healthResults.push({
        serviceName: 'database',
        healthy: true,
        latency: dbLatency,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      healthResults.push({
        serviceName: 'database',
        healthy: false,
        error: errorMessage,
      })
      errors.push(`Database: ${errorMessage}`)
    }

    // 3. Build service endpoints based on environment
    const isLocal = project.environment === 'dev'
    const baseUrl = isLocal
      ? `http://localhost:${process.env.PORT || 3000}`
      : process.env.NEXT_PUBLIC_API_URL || 'https://api.nextmavens.com'

    // 4. Check enabled services
    const enabledServices = services
      .filter((s: any) => s.enabled)
      .map((s: any) => s.service_type)

    // 5. Check internal health endpoint (provides overall system health)
    try {
      const healthEndpoint = `${baseUrl}/internal/health`
      const healthResult = await checkServiceHealth(healthEndpoint, 5000)

      healthResults.push({
        serviceName: 'api_gateway',
        healthy: healthResult.healthy,
        latency: healthResult.latency,
        error: healthResult.error,
      })

      if (!healthResult.healthy) {
        errors.push(`API Gateway: ${healthResult.error || 'Health check failed'}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      healthResults.push({
        serviceName: 'api_gateway',
        healthy: false,
        error: errorMessage,
      })
      errors.push(`API Gateway: ${errorMessage}`)
    }

    // 6. Check auth service if enabled
    if (enabledServices.includes('auth')) {
      try {
        // Auth service health check via control plane
        const authHealthEndpoint = `${baseUrl}/api/v1/health/auth`
        const authResult = await checkServiceHealth(authHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'auth',
          healthy: authResult.healthy,
          latency: authResult.latency,
          error: authResult.error,
        })

        if (!authResult.healthy) {
          errors.push(`Auth: ${authResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'auth',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`Auth: ${errorMessage}`)
      }
    }

    // 7. Check realtime service if enabled
    if (enabledServices.includes('realtime')) {
      try {
        const realtimeHealthEndpoint = `${baseUrl}/api/v1/health/realtime`
        const realtimeResult = await checkServiceHealth(realtimeHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'realtime',
          healthy: realtimeResult.healthy,
          latency: realtimeResult.latency,
          error: realtimeResult.error,
        })

        if (!realtimeResult.healthy) {
          errors.push(`Realtime: ${realtimeResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'realtime',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`Realtime: ${errorMessage}`)
      }
    }

    // 8. Check storage service if enabled
    if (enabledServices.includes('storage')) {
      try {
        const storageHealthEndpoint = `${baseUrl}/api/v1/health/storage`
        const storageResult = await checkServiceHealth(storageHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'storage',
          healthy: storageResult.healthy,
          latency: storageResult.latency,
          error: storageResult.error,
        })

        if (!storageResult.healthy) {
          errors.push(`Storage: ${storageResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'storage',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`Storage: ${errorMessage}`)
      }
    }

    // 9. Check GraphQL service if enabled
    if (enabledServices.includes('graphql')) {
      try {
        const graphqlHealthEndpoint = `${baseUrl}/api/v1/health/graphql`
        const graphqlResult = await checkServiceHealth(graphqlHealthEndpoint, 3000)

        healthResults.push({
          serviceName: 'graphql',
          healthy: graphqlResult.healthy,
          latency: graphqlResult.latency,
          error: graphqlResult.error,
        })

        if (!graphqlResult.healthy) {
          errors.push(`GraphQL: ${graphqlResult.error || 'Health check failed'}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        healthResults.push({
          serviceName: 'graphql',
          healthy: false,
          error: errorMessage,
        })
        errors.push(`GraphQL: ${errorMessage}`)
      }
    }

    // 10. Determine overall success
    const allServicesHealthy = healthResults.every((result) => result.healthy)

    if (allServicesHealthy) {
      return {
        success: true,
      }
    }

    // Build detailed error message
    const unhealthyServices = healthResults
      .filter((r) => !r.healthy)
      .map((r) => r.serviceName)
      .join(', ')

    return {
      success: false,
      error: `Some services are not ready: ${unhealthyServices}`,
      errorDetails: {
        error_type: 'ServiceHealthCheckError',
        health_results: healthResults,
        errors,
        context: {
          projectId,
          projectSlug: project.slug,
          enabledServices,
        },
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
      error: `Failed to verify services: ${errorMessage}`,
      errorDetails,
    }
  }
}

/**
 * Get step handler by step name
 *
 * Returns the appropriate handler function for a given step name.
 * Throws an error if the step name is unknown.
 *
 * @param stepName - The provisioning step name
 * @returns Step handler function
 * @throws Error if step name is unknown or has no handler
 */
export function getStepHandler(stepName: string): StepHandler {
  switch (stepName) {
    case 'verify_services':
      return verifyServicesHandler

    // Other step handlers can be added here as they are implemented
    // case 'create_tenant_database':
    //   return createTenantDatabaseHandler
    // case 'create_tenant_schema':
    //   return createTenantSchemaHandler
    // case 'register_auth_service':
    //   return registerAuthServiceHandler
    // case 'register_realtime_service':
    //   return registerRealtimeServiceHandler
    // case 'register_storage_service':
    //   return registerStorageServiceHandler
    // case 'generate_api_keys':
    //   return generateApiKeysHandler

    default:
      throw new Error(`No handler implemented for step: ${stepName}`)
  }
}

/**
 * Check if a step has a handler implemented
 *
 * @param stepName - The provisioning step name
 * @returns True if a handler exists for the step
 */
export function hasStepHandler(stepName: string): boolean {
  try {
    getStepHandler(stepName)
    return true
  } catch {
    return false
  }
}
