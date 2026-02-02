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

// Types
export type {
  EncryptedSecret,
  SecretEncryptionResult,
  SecretDecryptionResult,
  EncryptionKey,
} from './types'

// Errors
export {
  SecretEncryptionError,
  SecretDecryptionError,
  InvalidKeyError,
} from './errors'

// Constants
export {
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  MASTER_KEY_ENV_VAR,
  CURRENT_KEY_VERSION,
} from './constants'

// Key management
export {
  getMasterKey,
  generateEncryptionKey,
} from './keys'

// Encryption operations
export {
  encryptSecret,
  decryptSecret,
  rotateSecretEncryption,
} from './encryption'

// Validation
export {
  isValidEncryptedSecret,
} from './validation'

// Utilities
export {
  generateTestIV,
  getAlgorithmInfo,
} from './utils'

// Convenience functions
export {
  encryptForStorage,
  decryptFromStorage,
} from './convenience'
