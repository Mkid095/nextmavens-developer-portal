/**
 * Cryptography Errors
 */

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
