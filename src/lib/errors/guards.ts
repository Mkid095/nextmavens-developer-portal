/**
 * Type Guards
 */

import { PlatformError } from './platform-error'

/**
 * Type guard to check if an error is a PlatformError
 */
export function isPlatformError(error: unknown): error is PlatformError {
  return error instanceof PlatformError
}
