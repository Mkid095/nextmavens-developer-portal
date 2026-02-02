/**
 * Provisioning Handler Utilities
 *
 * Helper functions and types used by provisioning step handlers.
 */

import type { PoolClient } from 'pg'

/**
 * Service health check result
 */
export interface ServiceHealthResult {
  serviceName: string
  healthy: boolean
  latency?: number
  error?: string
}

/**
 * Helper function to create a policy idempotently (for PostgreSQL 15 compatibility)
 * Drops the policy first if it exists, then creates it
 *
 * @param client - Database client
 * @param fullCreatePolicySql - Complete CREATE POLICY SQL statement
 * @throws Error if the CREATE POLICY statement is invalid
 */
export async function createPolicyIdempotently(
  client: PoolClient,
  fullCreatePolicySql: string
): Promise<void> {
  // Extract policy name from CREATE POLICY statement
  const match = fullCreatePolicySql.match(/CREATE POLICY (\w+) ON "(.+?)"\.(.+)/)
  if (!match) {
    throw new Error(`Invalid CREATE POLICY statement: ${fullCreatePolicySql}`)
  }

  const [, policyName, schema, table] = match

  // Drop policy if it exists (ignore error if it doesn't)
  await client.query(`DROP POLICY IF EXISTS ${policyName} ON "${schema}"."${table}"`).catch(() => {
    // Ignore error
  })

  // Create the policy
  await client.query(fullCreatePolicySql)
}

/**
 * Perform health check on a service endpoint
 *
 * @param endpoint - The service endpoint to check
 * @param timeout - Request timeout in milliseconds (default: 5000)
 * @returns Service health result with status and latency
 */
export async function checkServiceHealth(
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
