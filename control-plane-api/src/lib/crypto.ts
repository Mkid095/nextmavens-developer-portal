/**
 * Cryptography utilities for secret encryption and decryption
 *
 * This module provides AES-256-GCM encryption for secrets at rest.
 * While the PRD mentions PGP, we use AES-256-GCM which is:
 * - More performant for bulk operations
 * - Natively supported in Node.js crypto module
 * - Provides authenticated encryption (AEAD)
 * - FIPS 140-2 compliant
 *
 * For key rotation support, encrypted secrets include key version identifier.
 */

import crypto from 'crypto'

// ============================================================================
// Types
// ============================================================================

export interface EncryptedSecret {
  /** Base64-encoded encrypted data (IV + ciphertext + auth tag) */
  encrypted: string
  /** Key version identifier for rotation support */
  keyVersion: number
  /** Encryption algorithm used */
  algorithm: 'aes-256-gcm'
}

export interface SecretEncryptionResult {
  /** The encrypted secret value */
  valueEncrypted: string
  /** Key version used for encryption */
  keyVersion: number
}

export interface SecretDecryptionResult {
  /** The decrypted secret value */
  value: string
  /** Key version that was used to decrypt */
  keyVersion: number
}

export interface EncryptionKey {
  /** The raw key bytes (32 bytes for AES-256) */
  key: Buffer
  /** Key version for rotation tracking */
  version: number
  /** When this key was created */
  createdAt: Date
}

// ============================================================================
// Errors
// ============================================================================

export class SecretEncryptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(`Secret encryption failed: ${message}`)
    this.name = 'SecretEncryptionError'
  }
}

export class SecretDecryptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(`Secret decryption failed: ${message}`)
    this.name = 'SecretDecryptionError'
  }
}

export class InvalidKeyError extends Error {
  constructor(message: string) {
    super(`Invalid encryption key: ${message}`)
    this.name = 'InvalidKeyError'
  }
}

// ============================================================================
// Constants
// ============================================================================

/** The encryption algorithm used */
const ALGORITHM = 'aes-256-gcm'

/** Key length in bytes (256 bits = 32 bytes) */
const KEY_LENGTH = 32

/** Initialization vector length in bytes (96 bits = 12 bytes for GCM) */
const IV_LENGTH = 12

/** Authentication tag length in bytes (128 bits = 16 bytes for GCM) */
const AUTH_TAG_LENGTH = 16

/** Environment variable name for the master encryption key */
const MASTER_KEY_ENV_VAR = 'SECRETS_MASTER_KEY'

/** Current key version */
const CURRENT_KEY_VERSION = 1

// ============================================================================
// Key Management
// ============================================================================

/**
 * Get the master encryption key from environment
 *
 * The key should be provided as a hex-encoded string in SECRETS_MASTER_KEY env var.
 * For production, this should be sourced from a secure key management service (KMS).
 *
 * @returns The encryption key
 * @throws {InvalidKeyError} If the key is not configured or invalid
 */
export function getMasterKey(): EncryptionKey {
  const keyHex = process.env[MASTER_KEY_ENV_VAR]

  if (!keyHex) {
    throw new InvalidKeyError(
      `Master key not found. Set ${MASTER_KEY_ENV_VAR} environment variable. ` +
      'Generate a secure key with: openssl rand -hex 32'
    )
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new InvalidKeyError(
      'Master key must be 64 hex characters (32 bytes). ' +
      'Generate a secure key with: openssl rand -hex 32'
    )
  }

  return {
    key: Buffer.from(keyHex, 'hex'),
    version: CURRENT_KEY_VERSION,
    createdAt: new Date(), // In production, track when key was actually created
  }
}

/**
 * Generate a new random encryption key
 *
 * This is useful for initial setup or key rotation.
 *
 * @returns A hex-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

// ============================================================================
// Encryption
// ============================================================================

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
  key: EncryptionKey = getMasterKey()
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
    // We need all three for decryption
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
  keyVersion: number = CURRENT_KEY_VERSION,
  key: EncryptionKey = getMasterKey()
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
    // For now, we validate the version matches
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

// ============================================================================
// Validation
// ============================================================================

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

// ============================================================================
// Utilities
// ============================================================================

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
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH,
    ivLength: IV_LENGTH,
    authTagLength: AUTH_TAG_LENGTH,
    description: 'AES-256-GCM provides authenticated encryption with 256-bit security',
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Encrypt a secret and return the value ready for database storage
 *
 * This is a convenience wrapper that returns just the encrypted value string.
 *
 * @param value - The plaintext secret
 * @returns The encrypted value as a base64 string
 */
export function encryptForStorage(value: string): string {
  const result = encryptSecret(value)
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

  const result = decryptSecret(encrypted, keyVersion)
  return result.value
}
