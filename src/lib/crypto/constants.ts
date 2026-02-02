/**
 * Cryptography Constants
 */

/** The encryption algorithm used */
export const ALGORITHM = 'aes-256-gcm'

/** Key length in bytes (256 bits = 32 bytes) */
export const KEY_LENGTH = 32

/** Initialization vector length in bytes (96 bits = 12 bytes for GCM) */
export const IV_LENGTH = 12

/** Authentication tag length in bytes (128 bits = 16 bytes for GCM) */
export const AUTH_TAG_LENGTH = 16

/** Environment variable name for the master encryption key */
export const MASTER_KEY_ENV_VAR = 'SECRETS_MASTER_KEY'

/** Current key version */
export const CURRENT_KEY_VERSION = 1
