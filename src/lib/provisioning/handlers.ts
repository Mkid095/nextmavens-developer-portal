/**
 * Provisioning Step Handlers Registry
 *
 * Central registry for all provisioning step handlers.
 * Delegates to individual handler modules in the handlers/ subdirectory.
 *
 * Story: US-008 - Implement Verify Services Step
 * PRD: Provisioning State Machine
 */

import type { StepHandler } from './steps'

// Import all step handlers from the handlers subdirectory
export {
  createTenantSchemaHandler,
  createTenantDatabaseHandler,
  registerAuthServiceHandler,
  registerRealtimeServiceHandler,
  registerStorageServiceHandler,
  generateApiKeysHandler,
  verifyServicesHandler,
} from './handlers'

// Re-export utilities for backward compatibility
export { createPolicyIdempotently, checkServiceHealth } from './handlers'
export type { ServiceHealthResult } from './handlers'

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
    case 'create_tenant_schema':
      return createTenantSchemaHandler
    case 'create_tenant_database':
      return createTenantDatabaseHandler
    case 'register_auth_service':
      return registerAuthServiceHandler
    case 'register_realtime_service':
      return registerRealtimeServiceHandler
    case 'register_storage_service':
      return registerStorageServiceHandler
    case 'generate_api_keys':
      return generateApiKeysHandler

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
