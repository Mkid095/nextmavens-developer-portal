/**
 * Encryption Operations
 */

import crypto from 'crypto'
import type { EncryptionKey, SecretEncryptionResult, SecretDecryptionResult } from './types'
import { SecretEncryptionError, SecretDecryptionError, InvalidKeyError } from './errors'
import { ALGORITHM, IV_LENGTH, AUTH_TAG_LENGTH, KEY_LENGTH, CURRENT_KEY_VERSION } from './constants'

/**
 * Encrypt a secret value
 *
 * Uses AES-256-GCM with:
 * - Random 96-bit IV for each encryption (required for GCM security)
 * - Authentication tag for integrity verification
 * - Key version identifier embedded for rotation support
 *
 * @param value - The plaintext secret value to encrypt
 * @param key - Optional encryption key (defaults to master key)
 * @returns The encrypted secret with metadata
 * @throws {SecretEncryptionError} If encryption fails
 */
export function encryptSecret(
  value: string,
  key: EncryptionKey
): SecretEncryptionResult {
  try {
    // Validate input
    if (typeof value !== 'string') {
      throw new SecretEncryptionError('Value must be a string')
    }

    if (value.length === 0) {
      throw new SecretEncryptionError('Value cannot be empty')
    }

    // Validate key
    if (key.key.length !== KEY_LENGTH) {
      throw new InvalidKeyError(`Key must be ${KEY_LENGTH} bytes`)
    }

    // Generate random IV (required for GCM - never reuse IV with same key)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key.key, iv)

    // Encrypt the value
    const ciphertext = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ])

    // Get authentication tag (for integrity verification)
    const authTag = cipher.getAuthTag()

    // Combine: IV + ciphertext + auth tag
    const encrypted = Buffer.concat([iv, ciphertext, authTag])

    // Encode as base64 for storage
    const encryptedBase64 = encrypted.toString('base64')

    return {
      valueEncrypted: encryptedBase64,
      keyVersion: key.version,
    }
  } catch (error) {
    if (error instanceof SecretEncryptionError || error instanceof InvalidKeyError) {
      throw error
    }
    throw new SecretEncryptionError('Failed to encrypt secret', error as Error)
  }
}

/**
 * Decrypt a secret value
 *
 * Verifies the authentication tag to ensure integrity before returning plaintext.
 *
 * @param encryptedBase64 - The base64-encoded encrypted data (IV + ciphertext + auth tag)
 * @param keyVersion - The key version to use for decryption
 * @param key - Optional encryption key (defaults to master key)
 * @returns The decrypted secret value with key version
 * @throws {SecretDecryptionError} If decryption fails or integrity check fails
 */
export function decryptSecret(
  encryptedBase64: string,
  keyVersion: number,
  key: EncryptionKey
): SecretDecryptionResult {
  try {
    // Validate input
    if (typeof encryptedBase64 !== 'string') {
      throw new SecretDecryptionError('Encrypted value must be a string')
    }

    if (encryptedBase64.length === 0) {
      throw new SecretDecryptionError('Encrypted value cannot be empty')
    }

    // In production, you would select the key based on keyVersion
    if (keyVersion !== key.version) {
      throw new SecretDecryptionError(
        `Key version ${keyVersion} not found. Current version: ${key.version}`
      )
    }

    // Decode from base64
    const encrypted = Buffer.from(encryptedBase64, 'base64')

    // Minimum length check: IV (12) + at least 1 byte of data + auth tag (16)
    const minLength = IV_LENGTH + 1 + AUTH_TAG_LENGTH
    if (encrypted.length < minLength) {
      throw new SecretDecryptionError(
        `Encrypted value too short. Must be at least ${minLength} bytes.`
      )
    }

    // Extract components
    const iv = encrypted.subarray(0, IV_LENGTH)
    const authTag = encrypted.subarray(encrypted.length - AUTH_TAG_LENGTH)
    const ciphertext = encrypted.subarray(IV_LENGTH, encrypted.length - AUTH_TAG_LENGTH)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key.key, iv)

    // Set authentication tag (must be set before final)
    decipher.setAuthTag(authTag)

    // Decrypt
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])

    return {
      value: plaintext.toString('utf8'),
      keyVersion: key.version,
    }
  } catch (error) {
    if (error instanceof SecretDecryptionError) {
      throw error
    }

    // GCM throws 'Unsupported state or unable to authenticate data' if auth tag fails
    if (error instanceof Error && error.message.includes('authenticate')) {
      throw new SecretDecryptionError(
        'Integrity check failed. Data may be corrupted or tampered with.',
        error
      )
    }

    throw new SecretDecryptionError('Failed to decrypt secret', error as Error)
  }
}

/**
 * Re-encrypt a secret with a new key (for key rotation)
 *
 * @param encryptedBase64 - The current encrypted value
 * @param oldKey - The old key used for encryption
 * @param newKey - The new key to use for re-encryption
 * @returns The re-encrypted secret with new key version
 * @throws {SecretEncryptionError} If re-encryption fails
 */
export function rotateSecretEncryption(
  encryptedBase64: string,
  oldKey: EncryptionKey,
  newKey: EncryptionKey
): SecretEncryptionResult {
  try {
    // Decrypt with old key
    const { value } = decryptSecret(encryptedBase64, oldKey.version, oldKey)

    // Re-encrypt with new key
    return encryptSecret(value, newKey)
  } catch (error) {
    throw new SecretEncryptionError('Failed to rotate secret encryption', error as Error)
  }
}
