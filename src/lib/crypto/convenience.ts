/**
 * Convenience Functions
 */

import { encryptSecret, decryptSecret } from './encryption'
import { getMasterKey } from './keys'
import { SecretDecryptionError } from './errors'

/**
 * Encrypt a secret and return the value ready for database storage
 *
 * This is a convenience wrapper that returns just the encrypted value string.
 *
 * @param value - The plaintext secret
 * @returns The encrypted value as a base64 string
 */
export function encryptForStorage(value: string): string {
  const result = encryptSecret(value, getMasterKey())
  // Format: keyVersion:encrypted (for easy key version lookup)
  return `${result.keyVersion}:${result.valueEncrypted}`
}

/**
 * Decrypt a secret from database storage
 *
 * This is a convenience wrapper that handles the keyVersion:encrypted format.
 *
 * @param storedValue - The stored encrypted value (keyVersion:encrypted format)
 * @returns The decrypted plaintext
 */
export function decryptFromStorage(storedValue: string): string {
  const parts = storedValue.split(':', 2)
  if (parts.length !== 2) {
    throw new SecretDecryptionError('Invalid encrypted value format')
  }

  const keyVersion = parseInt(parts[0], 10)
  const encrypted = parts[1]

  const result = decryptSecret(encrypted, keyVersion, getMasterKey())
  return result.value
}
