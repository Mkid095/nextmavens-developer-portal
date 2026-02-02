/**
 * Cryptography Types
 */

/** Base64-encoded encrypted data (IV + ciphertext + auth tag) */
export interface EncryptedSecret {
  encrypted: string
  /** Key version identifier for rotation support */
  keyVersion: number
  /** Encryption algorithm used */
  algorithm: 'aes-256-gcm'
}

/** The encrypted secret value */
export interface SecretEncryptionResult {
  valueEncrypted: string
  /** Key version used for encryption */
  keyVersion: number
}

/** The decrypted secret value */
export interface SecretDecryptionResult {
  value: string
  /** Key version that was used to decrypt */
  keyVersion: number
}

/** The raw key bytes (32 bytes for AES-256) */
export interface EncryptionKey {
  key: Buffer
  /** Key version for rotation tracking */
  version: number
  /** When this key was created */
  createdAt: Date
}
