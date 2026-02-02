/**
 * Key Management
 */

import crypto from 'crypto'
import { MASTER_KEY_ENV_VAR, CURRENT_KEY_VERSION, KEY_LENGTH } from './constants'
import { InvalidKeyError } from './errors'
import type { EncryptionKey } from './types'

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
    createdAt: new Date(),
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
