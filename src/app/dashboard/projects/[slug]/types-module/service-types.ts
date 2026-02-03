/**
 * Project Types Module - Service Types
 */

import type { ServiceStatus } from '@/lib/types/service-status.types'

/**
 * Service statuses for all services (US-010)
 */
export interface ServiceStatuses {
  database: ServiceStatus
  auth: ServiceStatus
  storage: ServiceStatus
  realtime: ServiceStatus
  graphql: ServiceStatus
}

/**
 * Service endpoints configuration
 */
export interface ServiceEndpoints {
  gateway: string
  auth: string
  graphql: string
  rest: string
  realtime: string
  storage: string
}

/**
 * Get service endpoints from environment or defaults
 */
export function getServiceEndpoints(): ServiceEndpoints {
  return {
    gateway: 'https://api.nextmavens.cloud',
    auth: 'https://auth.nextmavens.cloud',
    graphql: 'https://graphql.nextmavens.cloud',
    rest: 'https://api.nextmavens.cloud',
    realtime: 'wss://realtime.nextmavens.cloud',
    storage: 'https://storage.nextmavens.cloud',
  }
}
