/**
 * Environment Types
 *
 * Type definitions for environment-aware features across the platform.
 * This enables different behavior based on project environment (prod/dev/staging).
 */

/**
 * Valid environment types
 * - prod: Production environment with strict limits and safety measures
 * - dev: Development environment with relaxed limits for experimentation
 * - staging: Staging environment for pre-production testing
 */
export type Environment = 'prod' | 'dev' | 'staging'

/**
 * Environment-specific configuration
 * Defines how different behaviors apply per environment
 */
export interface EnvironmentConfig {
  /** Environment identifier */
  environment: Environment

  /** Rate limit multiplier (1 = standard, higher = more requests allowed) */
  rateLimitMultiplier: number

  /** Whether auto-suspend is enabled for this environment */
  autoSuspendEnabled: boolean

  /** Log level for this environment */
  logLevel: 'debug' | 'info' | 'warn' | 'error'

  /** Maximum webhook retry attempts (null = infinite retries) */
  maxWebhookRetries: number | null
}

/**
 * Default environment configuration per environment type
 */
export const DEFAULT_ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  prod: {
    environment: 'prod',
    rateLimitMultiplier: 1,
    autoSuspendEnabled: true,
    logLevel: 'info',
    maxWebhookRetries: 3,
  },
  dev: {
    environment: 'dev',
    rateLimitMultiplier: 10,
    autoSuspendEnabled: false,
    logLevel: 'debug',
    maxWebhookRetries: null, // Infinite retries
  },
  staging: {
    environment: 'staging',
    rateLimitMultiplier: 5,
    autoSuspendEnabled: false,
    logLevel: 'debug',
    maxWebhookRetries: 5,
  },
}

/**
 * Zod schema for validating environment values
 */
import { z } from 'zod'

export const environmentSchema = z.enum(['prod', 'dev', 'staging'], {
  message: 'Environment must be one of: prod, dev, staging',
})

export type EnvironmentInput = z.infer<typeof environmentSchema>
