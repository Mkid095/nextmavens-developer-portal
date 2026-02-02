/**
 * GraphQL Service Snapshot Client Fetcher
 * Handles fetching snapshots from the control plane
 */

import type { ControlPlaneSnapshot } from '@/lib/snapshot/types'
import type { SnapshotClientConfig, SnapshotFetchResult } from './types'
import { CORRELATION_HEADER } from '@/lib/middleware/correlation'

/**
 * Fetch a snapshot from the control plane
 * @param projectId - Project ID to fetch snapshot for
 * @param config - Client configuration
 * @param getCorrelationId - Function to get correlation ID
 * @returns Snapshot fetch result
 */
export async function fetchSnapshot(
  projectId: string,
  config: SnapshotClientConfig,
  getCorrelationId: () => string,
  formatLog: (message: string) => string
): Promise<SnapshotFetchResult> {
  try {
    const url = `${config.controlPlaneUrl}/api/internal/snapshot?project_id=${projectId}`
    const correlationId = getCorrelationId()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeout)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // US-005: Propagate correlation ID to control plane
        [CORRELATION_HEADER]: correlationId,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 503) {
        console.error(formatLog('Control plane unavailable (503)'))
        return {
          success: false,
          error: 'Control plane unavailable',
        }
      }

      if (response.status === 404) {
        console.error(formatLog(`Project not found: ${projectId}`))
        return {
          success: false,
          error: 'Project not found',
        }
      }

      console.error(formatLog(`Unexpected response: ${response.status}`))
      return {
        success: false,
        error: `Unexpected response: ${response.status}`,
      }
    }

    const data = await response.json()

    if (!data.snapshot) {
      console.error(formatLog('No snapshot in response'))
      return {
        success: false,
        error: 'Invalid response format',
      }
    }

    return {
      success: true,
      snapshot: data.snapshot as ControlPlaneSnapshot,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(formatLog('Request timeout'))
      return {
        success: false,
        error: 'Request timeout',
      }
    }

    console.error(formatLog('Fetch error:'), error)
    return {
      success: false,
      error: 'Failed to fetch snapshot',
    }
  }
}
