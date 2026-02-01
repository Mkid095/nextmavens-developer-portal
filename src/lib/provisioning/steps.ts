/**
 * Provisioning Steps Configuration
 *
 * Defines ordered provisioning steps and their handler functions.
 * Each step has a name, description, order, and optional handler function.
 *
 * Story: US-002 - Define Provisioning Steps
 * PRD: Provisioning State Machine
 */

import type { Pool } from 'pg'

/**
 * Provisioning step status
 */
export type ProvisioningStepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

/**
 * Provisioning step definition
 */
export interface ProvisioningStep {
  /** Unique step identifier */
  name: string
  /** Human-readable description */
  description: string
  /** Execution order (lower = earlier) */
  order: number
  /** Estimated duration in milliseconds */
  estimatedDuration: number
  /** Whether this step can be retried */
  retryable: boolean
  /** Maximum retry attempts */
  maxRetries: number
}

/**
 * Provisioning step execution result
 */
export interface StepExecutionResult {
  success: boolean
  error?: string
  errorDetails?: Record<string, unknown>
}

/**
 * Step handler function type
 */
export type StepHandler = (projectId: string, pool: Pool) => Promise<StepExecutionResult>

/**
 * Ordered provisioning steps
 *
 * These steps must be executed in order during project provisioning.
 * Each step represents a distinct operation that can fail independently.
 */
export const PROVISIONING_STEPS: readonly ProvisioningStep[] = [
  {
    name: 'create_tenant_schema',
    description: 'Create tenant schema',
    order: 1,
    estimatedDuration: 2000,
    retryable: true,
    maxRetries: 3,
  },
  {
    name: 'create_tenant_database',
    description: 'Create tenant database',
    order: 2,
    estimatedDuration: 5000,
    retryable: true,
    maxRetries: 3,
  },
  {
    name: 'register_auth_service',
    description: 'Register with auth service',
    order: 3,
    estimatedDuration: 3000,
    retryable: true,
    maxRetries: 3,
  },
  {
    name: 'register_realtime_service',
    description: 'Register with realtime service',
    order: 4,
    estimatedDuration: 3000,
    retryable: true,
    maxRetries: 3,
  },
  {
    name: 'register_storage_service',
    description: 'Register with storage service',
    order: 5,
    estimatedDuration: 3000,
    retryable: true,
    maxRetries: 3,
  },
  {
    name: 'generate_api_keys',
    description: 'Generate API keys',
    order: 6,
    estimatedDuration: 1000,
    retryable: true,
    maxRetries: 3,
  },
  {
    name: 'verify_services',
    description: 'Verify all services are ready',
    order: 7,
    estimatedDuration: 2000,
    retryable: true,
    maxRetries: 5,
  },
] as const

/**
 * Get provisioning step by name
 */
export function getProvisioningStep(name: string): ProvisioningStep | undefined {
  return PROVISIONING_STEPS.find(step => step.name === name)
}

/**
 * Get provisioning steps in order
 */
export function getOrderedProvisioningSteps(): readonly ProvisioningStep[] {
  return [...PROVISIONING_STEPS].sort((a, b) => a.order - b.order)
}

/**
 * Get step names in order
 */
export function getOrderedStepNames(): readonly string[] {
  return getOrderedProvisioningSteps().map(step => step.name)
}

/**
 * Get step order by name
 */
export function getStepOrder(name: string): number {
  const step = getProvisioningStep(name)
  return step?.order ?? -1
}

/**
 * Calculate total estimated duration for all steps
 */
export function getTotalEstimatedDuration(): number {
  return PROVISIONING_STEPS.reduce((total, step) => total + step.estimatedDuration, 0)
}

/**
 * Get step name by order
 */
export function getStepNameByOrder(order: number): string | undefined {
  const step = PROVISIONING_STEPS.find(s => s.order === order)
  return step?.name
}

/**
 * Validate step name
 */
export function isValidStepName(name: string): boolean {
  return PROVISIONING_STEPS.some(step => step.name === name)
}

/**
 * Get next step after the given step name
 */
export function getNextStep(currentStepName: string): ProvisioningStep | undefined {
  const currentOrder = getStepOrder(currentStepName)
  if (currentOrder === -1) return undefined
  return PROVISIONING_STEPS.find(step => step.order === currentOrder + 1)
}

/**
 * Get previous step before the given step name
 */
export function getPreviousStep(currentStepName: string): ProvisioningStep | undefined {
  const currentOrder = getStepOrder(currentStepName)
  if (currentOrder === -1) return undefined
  return PROVISIONING_STEPS.find(step => step.order === currentOrder - 1)
}

/**
 * Check if step can be retried
 */
export function isStepRetryable(name: string, retryCount: number): boolean {
  const step = getProvisioningStep(name)
  if (!step || !step.retryable) return false
  return retryCount < step.maxRetries
}

/**
 * Type guard for provisioning step status
 */
export function isValidStepStatus(status: string): status is ProvisioningStepStatus {
  return ['pending', 'running', 'success', 'failed', 'skipped'].includes(status)
}
