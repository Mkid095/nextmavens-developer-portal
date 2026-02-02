/**
 * Storage Service Snapshot Client Constants
 *
 * Default configuration and shared state for the snapshot client.
 */

import { SnapshotClientConfig, CachedSnapshot, RequestContext } from './types'
import { ControlPlaneSnapshot } from '@/lib/snapshot/types'

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: SnapshotClientConfig = {
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || 'http://localhost:3000',
  cacheTTL: 30 * 1000, // 30 seconds
  requestTimeout: 5000, // 5 seconds
}

/**
 * In-memory snapshot cache
 * Key: project_id, Value: cached snapshot
 */
export const snapshotCache = new Map<string, CachedSnapshot>()

/**
 * Request context
 */
export const globalRequestContext: RequestContext = {}
