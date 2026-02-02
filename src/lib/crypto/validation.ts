/**
 * Validation Utilities
 */

import { IV_LENGTH, AUTH_TAG_LENGTH } from './constants'

/**
 * Validate if a string is a valid encrypted secret
 *
 * @param value - The value to validate
 * @returns True if the value appears to be valid encrypted data
 */
export function isValidEncryptedSecret(value: string): boolean {
  try {
    if (typeof value !== 'string' || value.length === 0) {
      return false
    }

    // Decode base64
    const encrypted = Buffer.from(value, 'base64')

    // Check minimum length
    const minExpectedLength = IV_LENGTH + AUTH_TAG_LENGTH
    return encrypted.length >= minExpectedLength
  } catch {
    return false
  }
}
