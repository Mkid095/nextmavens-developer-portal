/**
 * Realtime Service Snapshot Client Configuration
 * Default configuration values
 */

import type { SnapshotClientConfig } from './types'

/**
 * Default configuration for the snapshot client
 */
export const DEFAULT_CONFIG: SnapshotClientConfig = {
  controlPlaneUrl: process.env.CONTROL_PLANE_URL || 'http://localhost:3000',
  cacheTTL: 30 * 1000, // 30 seconds
  requestTimeout: 5000, // 5 seconds
}
