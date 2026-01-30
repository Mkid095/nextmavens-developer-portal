/**
 * API Gateway Module
 *
 * Exports all API gateway-related functionality for gateway enforcement.
 */

export * from './snapshot-client'

/**
 * Gateway service types
 */
export type { GatewayService } from './snapshot-client'

/**
 * Re-export common types from snapshot module
 */
export type {
  ControlPlaneSnapshot,
  ProjectStatus,
  ServiceConfig,
  Services,
  RateLimit,
  Quotas,
} from '@/lib/snapshot/types'
