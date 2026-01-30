/**
 * Environment Config Helper
 *
 * Provides environment-specific configuration for different platform behaviors.
 * This enables different rules based on project environment (prod/dev/staging).
 *
 * US-003: Create Environment Config Helper
 */

/**
 * Valid environment types
 * - prod: Production environment with strict limits and safety measures
 * - dev: Development environment with relaxed limits for experimentation
 * - staging: Staging environment for pre-production testing
 */
export type Environment = 'prod' | 'dev' | 'staging'

/**
 * Snapshot environment types (from database)
 * These differ from the Environment type for backward compatibility
 */
export type SnapshotEnvironment = 'production' | 'development' | 'staging'

/**
 * Map snapshot environment to environment config type
 *
 * @param snapshotEnv - Environment from snapshot (production/development/staging)
 * @returns Corresponding environment config type (prod/dev/staging)
 */
export function mapSnapshotEnvironment(snapshotEnv: SnapshotEnvironment): Environment {
  const mapping: Record<SnapshotEnvironment, Environment> = {
    production: 'prod',
    development: 'dev',
    staging: 'staging',
  }
  return mapping[snapshotEnv]
}

/**
 * Environment-specific configuration
 * Defines how different behaviors apply per environment
 */
export interface EnvironmentConfig {
  /** Environment identifier */
  environment: Environment

  /** Rate limit multiplier (1 = standard, higher = more requests allowed) */
  rate_limit_multiplier: number

  /** Whether auto-suspend is enabled for this environment */
  auto_suspend_enabled: boolean

  /** Log level for this environment */
  log_level: 'debug' | 'info' | 'warn' | 'error'

  /** Maximum webhook retry attempts (null = infinite retries) */
  max_webhook_retries: number | null
}

/**
 * Get environment-specific configuration
 *
 * Returns config object with environment-specific behavior settings.
 * Each environment has different rate limits, auto-suspend behavior,
 * logging verbosity, and webhook retry policies.
 *
 * @param environment - The environment to get config for ('prod' | 'dev' | 'staging')
 * @returns EnvironmentConfig object with settings for the specified environment
 *
 * @example
 * ```ts
 * const prodConfig = getEnvironmentConfig('prod')
 * // { environment: 'prod', rate_limit_multiplier: 1, auto_suspend_enabled: true, ... }
 *
 * const devConfig = getEnvironmentConfig('dev')
 * // { environment: 'dev', rate_limit_multiplier: 10, auto_suspend_enabled: false, ... }
 * ```
 */
export function getEnvironmentConfig(environment: Environment): EnvironmentConfig {
  const configs: Record<Environment, EnvironmentConfig> = {
    prod: {
      environment: 'prod',
      rate_limit_multiplier: 1,
      auto_suspend_enabled: true,
      log_level: 'info',
      max_webhook_retries: 3,
    },
    dev: {
      environment: 'dev',
      rate_limit_multiplier: 10,
      auto_suspend_enabled: false,
      log_level: 'debug',
      max_webhook_retries: null, // Infinite retries
    },
    staging: {
      environment: 'staging',
      rate_limit_multiplier: 5,
      auto_suspend_enabled: false,
      log_level: 'debug',
      max_webhook_retries: 5,
    },
  }

  return configs[environment]
}
