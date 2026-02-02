/**
 * Auto Status Transitions Utilities
 * Helper functions for the auto status transitions background job
 */

import { ActorType } from '@nextmavenspacks/audit-logs-database'

/**
 * System actor for background job actions
 */
export function systemActor() {
  return {
    type: ActorType.SYSTEM,
    id: 'auto-status-transitions-job',
    name: 'Auto Status Transitions Background Job',
  }
}
