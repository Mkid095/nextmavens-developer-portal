/**
 * Environment Validation
 *
 * Validates that API keys are used in their intended environment.
 * This prevents dev keys from being used in production and vice versa.
 */

import type { ApiKey } from './types/api-key.types'
import type { Environment } from './features/environment-parity/types/environment.types'

/**
 * Error thrown when an API key is used in the wrong environment.
 */
export class EnvironmentMismatchError extends Error {
  public readonly keyEnvironment: string
  public readonly projectEnvironment: string

  constructor(keyEnvironment: string, projectEnvironment: string) {
    super(
      `API key environment mismatch: key is for '${keyEnvironment}' but project is in '${projectEnvironment}' environment`
    )
    this.name = 'EnvironmentMismatchError'
    this.keyEnvironment = keyEnvironment
    this.projectEnvironment = projectEnvironment
  }
}

/**
 * Validate that an API key's environment matches the project's environment.
 *
 * This prevents developers from accidentally using dev keys in production,
 * or production keys in development environments.
 *
 * @param apiKey - The API key to validate
 * @param projectEnvironment - The project's environment
 * @throws {EnvironmentMismatchError} If the environments don't match
 * @returns true if the environments match
 */
export function validateKeyEnvironment(
  apiKey: Pick<ApiKey, 'environment' | 'key_prefix'>,
  projectEnvironment: Environment
): boolean {
  // If the key doesn't have an environment set, allow it (backwards compatibility)
  if (!apiKey.environment) {
    return true
  }

  // Check if the key's environment matches the project's environment
  if (apiKey.environment !== projectEnvironment) {
    throw new EnvironmentMismatchError(apiKey.environment, projectEnvironment)
  }

  return true
}

/**
 * Check if a key prefix matches an environment.
 * This is a lightweight check that can be done without database lookup.
 *
 * Key prefixes:
 * - pk_prod_, sk_prod_, sr_prod_ → production
 * - pk_dev_, sk_dev_, sr_dev_ → development
 * - pk_staging_, sk_staging_, sr_staging_ → staging
 *
 * @param keyPrefix - The key prefix to check
 * @returns The environment inferred from the key prefix
 */
export function getEnvironmentFromKeyPrefix(keyPrefix: string): 'prod' | 'dev' | 'staging' | null {
  if (keyPrefix.includes('_prod_')) {
    return 'prod'
  }
  if (keyPrefix.includes('_dev_')) {
    return 'dev'
  }
  if (keyPrefix.includes('_staging_')) {
    return 'staging'
  }
  // Unknown key prefix format
  return null
}

/**
 * Quick validation that checks if a key prefix is valid for a project environment.
 * This can be used as a fast fail before database lookup.
 *
 * @param keyPrefix - The key prefix to check
 * @param projectEnvironment - The project's environment
 * @returns true if the key prefix appears to match the environment
 */
export function validateKeyPrefixForEnvironment(
  keyPrefix: string,
  projectEnvironment: Environment
): boolean {
  const keyEnv = getEnvironmentFromKeyPrefix(keyPrefix)

  // If we can't determine the environment from the prefix, allow it
  // (will be validated properly later with the full key record)
  if (!keyEnv) {
    return true
  }

  return keyEnv === projectEnvironment
}
