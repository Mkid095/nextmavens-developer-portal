/**
 * Verify Services Step Handler
 *
 * Story: US-008 - Implement Verify Services Step
 */

import type { Pool } from 'pg'
import type { StepHandler, StepExecutionResult } from '../steps'
import { getAllSteps, isProvisioningComplete } from '../state-machine'
import { isValidTransition } from '@/lib/types/project-lifecycle.types'
import { checkServiceHealth, type ServiceHealthResult } from './utils'

export const verifyServicesHandler: StepHandler = async (
  projectId: string,
  pool: Pool
): Promise<StepExecutionResult> => {
  const healthResults: ServiceHealthResult[] = []
  const errors: string[] = []

  try {
    const projectResult = await pool.query(
      `SELECT p.id, p.slug, p.tenant_id, p.status, p.environment,
        COALESCE(jsonb_agg(jsonb_build_object(
          'service_type', ps.service_type,
          'enabled', ps.enabled
        ) ORDER BY ps.service_type) FILTER (WHERE ps.service_type IS NOT NULL), '[]'::jsonb) as services
      FROM projects p
      LEFT JOIN project_services ps ON ps.project_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, p.slug, p.tenant_id, p.status, p.environment`,
      [projectId]
    )

    if (projectResult.rows.length === 0) {
      return {
        success: false,
        error: `Project not found: ${projectId}`,
        errorDetails: { error_type: 'NotFoundError', context: { projectId } },
      }
    }

    const project = projectResult.rows[0]
    const services = project.services || []

    // Check database connectivity
    try {
      const dbStartTime = Date.now()
      await pool.query('SELECT 1')
      healthResults.push({ serviceName: 'database', healthy: true, latency: Date.now() - dbStartTime })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      healthResults.push({ serviceName: 'database', healthy: false, error: msg })
      errors.push(`Database: ${msg}`)
    }

    const isLocal = project.environment === 'dev'
    const baseUrl = isLocal ? 'http://localhost:3000' : 'https://api.nextmavens.com'
    const enabledServices = services.filter((s: any) => s.enabled).map((s: any) => s.service_type)

    // Check API Gateway
    try {
      const result = await checkServiceHealth(`${baseUrl}/internal/health`, 5000)
      healthResults.push({ serviceName: 'api_gateway', healthy: result.healthy, latency: result.latency, error: result.error })
      if (!result.healthy) errors.push(`API Gateway: ${result.error || 'Health check failed'}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      healthResults.push({ serviceName: 'api_gateway', healthy: false, error: msg })
      errors.push(`API Gateway: ${msg}`)
    }

    // Check auth service
    if (enabledServices.includes('auth')) {
      try {
        const result = await checkServiceHealth(`${baseUrl}/api/v1/health/auth`, 3000)
        healthResults.push({ serviceName: 'auth', healthy: result.healthy, latency: result.latency, error: result.error })
        if (!result.healthy) errors.push(`Auth: ${result.error || 'Health check failed'}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        healthResults.push({ serviceName: 'auth', healthy: false, error: msg })
        errors.push(`Auth: ${msg}`)
      }
    }

    // Check realtime service
    if (enabledServices.includes('realtime')) {
      try {
        const result = await checkServiceHealth(`${baseUrl}/api/v1/health/realtime`, 3000)
        healthResults.push({ serviceName: 'realtime', healthy: result.healthy, latency: result.latency, error: result.error })
        if (!result.healthy) errors.push(`Realtime: ${result.error || 'Health check failed'}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        healthResults.push({ serviceName: 'realtime', healthy: false, error: msg })
        errors.push(`Realtime: ${msg}`)
      }
    }

    // Check storage service
    if (enabledServices.includes('storage')) {
      try {
        const result = await checkServiceHealth(`${baseUrl}/api/v1/health/storage`, 3000)
        healthResults.push({ serviceName: 'storage', healthy: result.healthy, latency: result.latency, error: result.error })
        if (!result.healthy) errors.push(`Storage: ${result.error || 'Health check failed'}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        healthResults.push({ serviceName: 'storage', healthy: false, error: msg })
        errors.push(`Storage: ${msg}`)
      }
    }

    // Check GraphQL service
    if (enabledServices.includes('graphql')) {
      try {
        const result = await checkServiceHealth(`${baseUrl}/api/v1/health/graphql`, 3000)
        healthResults.push({ serviceName: 'graphql', healthy: result.healthy, latency: result.latency, error: result.error })
        if (!result.healthy) errors.push(`GraphQL: ${result.error || 'Health check failed'}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        healthResults.push({ serviceName: 'graphql', healthy: false, error: msg })
        errors.push(`GraphQL: ${msg}`)
      }
    }

    const allServicesHealthy = healthResults.every((r) => r.healthy)

    if (allServicesHealthy) {
      // Auto-transition CREATED to ACTIVE
      if (project.status === 'created') {
        try {
          const allSteps = await getAllSteps(pool, projectId)
          if (isProvisioningComplete(allSteps) && isValidTransition('created', 'active')) {
            await pool.query('UPDATE projects SET status = active, updated_at = NOW() WHERE id = $1', [projectId])
            console.log(`[Provisioning] Project ${projectId} transitioned from CREATED to ACTIVE`)
          }
        } catch (statusError) {
          console.error('[Provisioning] Failed to auto-transition project status:', statusError)
        }
      }
      return { success: true }
    }

    const unhealthyServices = healthResults.filter((r) => !r.healthy).map((r) => r.serviceName).join(', ')
    return {
      success: false,
      error: `Some services are not ready: ${unhealthyServices}`,
      errorDetails: {
        error_type: 'ServiceHealthCheckError',
        health_results: healthResults,
        errors,
        context: { projectId, projectSlug: project.slug, enabledServices },
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: `Failed to verify services: ${msg}`,
      errorDetails: {
        error_type: error instanceof Error ? error.constructor.name : 'Error',
        context: { projectId },
      },
    }
  }
}
