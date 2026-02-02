/**
 * Utility Functions
 */

import crypto from 'crypto'
import { IV_LENGTH } from './constants'

/**
 * Generate a random IV for testing purposes
 *
 * Note: This should NOT be used in production. Production encryption
 * always generates a fresh random IV for each encryption operation.
 *
 * @returns A random initialization vector
 */
export function generateTestIV(): Buffer {
  return crypto.randomBytes(IV_LENGTH)
}

/**
 * Get information about the encryption algorithm
 *
 * @returns Algorithm details
 */
export function getAlgorithmInfo() {
  return {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 12,
    authTagLength: 16,
    description: 'AES-256-GCM provides authenticated encryption with 256-bit security',
  }
}
