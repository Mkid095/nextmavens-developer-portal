/**
 * Tests for the crypto module
 *
 * Run with: npx tsx src/lib/crypto/__tests__/crypto.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptSecret,
  decryptSecret,
  encryptForStorage,
  decryptFromStorage,
  generateEncryptionKey,
  getMasterKey,
  isValidEncryptedSecret,
  rotateSecretEncryption,
  getAlgorithmInfo,
  InvalidKeyError,
  SecretEncryptionError,
  SecretDecryptionError,
  type EncryptionKey,
} from '../index';

describe('crypto', () => {
  let testKey: EncryptionKey;

  beforeEach(() => {
    // Set up a test key for each test
    const keyHex = generateEncryptionKey();
    testKey = {
      key: Buffer.from(keyHex, 'hex'),
      version: 1,
      createdAt: new Date(),
    };
  });

  describe('getAlgorithmInfo', () => {
    it('should return algorithm information', () => {
      const info = getAlgorithmInfo();
      expect(info.algorithm).toBe('aes-256-gcm');
      expect(info.keyLength).toBe(32);
      expect(info.ivLength).toBe(12);
      expect(info.authTagLength).toBe(16);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid 32-byte key', () => {
      const keyHex = generateEncryptionKey();
      expect(keyHex).toMatch(/^[0-9a-f]{64}$/);
      expect(Buffer.from(keyHex, 'hex').length).toBe(32);
    });

    it('should generate different keys each time', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('encryptSecret and decryptSecret', () => {
    it('should encrypt and decrypt a secret successfully', () => {
      const plaintext = 'my-super-secret-password';
      const encrypted = encryptSecret(plaintext, testKey);
      const decrypted = decryptSecret(encrypted.valueEncrypted, encrypted.keyVersion, testKey);

      expect(decrypted.value).toBe(plaintext);
      expect(decrypted.keyVersion).toBe(1);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'same-plaintext';
      const encrypted1 = encryptSecret(plaintext, testKey);
      const encrypted2 = encryptSecret(plaintext, testKey);

      // Ciphertext should be different due to random IV
      expect(encrypted1.valueEncrypted).not.toBe(encrypted2.valueEncrypted);

      // But both should decrypt to the same value
      expect(decryptSecret(encrypted1.valueEncrypted, 1, testKey).value).toBe(plaintext);
      expect(decryptSecret(encrypted2.valueEncrypted, 1, testKey).value).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'p@ssw0rd!#$%^&*()_+-=[]{}|;:\'",.<>/?`~';
      const encrypted = encryptSecret(plaintext, testKey);
      const decrypted = decryptSecret(encrypted.valueEncrypted, 1, testKey);

      expect(decrypted.value).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Hello 世界 🌍🔐';
      const encrypted = encryptSecret(plaintext, testKey);
      const decrypted = decryptSecret(encrypted.valueEncrypted, 1, testKey);

      expect(decrypted.value).toBe(plaintext);
    });

    it('should handle empty plaintext after base64 decoding', () => {
      const encrypted = encryptSecret('', testKey);
      expect(() => decryptSecret(encrypted.valueEncrypted, 1, testKey)).not.toThrow();
      const decrypted = decryptSecret(encrypted.valueEncrypted, 1, testKey);
      expect(decrypted.value).toBe('');
    });

    it('should reject empty value when encrypting', () => {
      expect(() => encryptSecret('', testKey)).toThrow(SecretEncryptionError);
      expect(() => encryptSecret('', testKey)).toThrow('cannot be empty');
    });

    it('should reject invalid encrypted value when decrypting', () => {
      expect(() => decryptSecret('invalid-base64!', 1, testKey)).toThrow(SecretDecryptionError);
    });

    it('should reject too-short encrypted value', () => {
      const shortValue = Buffer.from('abc').toString('base64');
      expect(() => decryptSecret(shortValue, 1, testKey)).toThrow(SecretDecryptionError);
    });

    it('should reject tampered encrypted value', () => {
      const plaintext = 'original-secret';
      const encrypted = encryptSecret(plaintext, testKey);

      // Tamper with the encrypted value
      const tampered = Buffer.from(encrypted.valueEncrypted, 'base64');
      tampered[0] = tampered[0] ^ 0xff; // Flip first byte
      const tamperedBase64 = tampered.toString('base64');

      expect(() => decryptSecret(tamperedBase64, 1, testKey)).toThrow(SecretDecryptionError);
    });

    it('should reject wrong key version', () => {
      const plaintext = 'secret';
      const encrypted = encryptSecret(plaintext, testKey);

      expect(() => decryptSecret(encrypted.valueEncrypted, 999, testKey)).toThrow(SecretDecryptionError);
    });
  });

  describe('encryptForStorage and decryptFromStorage', () => {
    it('should encrypt and decrypt in storage format', () => {
      const plaintext = 'storage-secret';
      const encrypted = encryptForStorage(plaintext);
      const decrypted = decryptFromStorage(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should use correct keyVersion format', () => {
      const plaintext = 'secret';
      const encrypted = encryptForStorage(plaintext);

      expect(encrypted).toMatch(/^\d+:/);
      const version = parseInt(encrypted.split(':', 1)[0], 10);
      expect(version).toBeGreaterThan(0);
    });

    it('should reject invalid storage format', () => {
      expect(() => decryptFromStorage('invalid-format')).toThrow(SecretDecryptionError);
    });

    it('should reject storage format without version', () => {
      expect(() => decryptFromStorage('base64value-only')).toThrow(SecretDecryptionError);
    });
  });

  describe('isValidEncryptedSecret', () => {
    it('should return true for valid encrypted secret', () => {
      const plaintext = 'valid-secret';
      const encrypted = encryptSecret(plaintext, testKey);
      expect(isValidEncryptedSecret(encrypted.valueEncrypted)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidEncryptedSecret('')).toBe(false);
    });

    it('should return false for non-string', () => {
      expect(isValidEncryptedSecret(null as unknown as string)).toBe(false);
      expect(isValidEncryptedSecret(undefined as unknown as string)).toBe(false);
    });

    it('should return false for invalid base64', () => {
      expect(isValidEncryptedSecret('not-valid-base64!')).toBe(false);
    });

    it('should return false for too-short value', () => {
      const shortValue = Buffer.from('short').toString('base64');
      expect(isValidEncryptedSecret(shortValue)).toBe(false);
    });
  });

  describe('rotateSecretEncryption', () => {
    it('should rotate encryption with new key', () => {
      const plaintext = 'rotate-me';
      const oldKey = {
        key: Buffer.from(generateEncryptionKey(), 'hex'),
        version: 1,
        createdAt: new Date(),
      };
      const newKey = {
        key: Buffer.from(generateEncryptionKey(), 'hex'),
        version: 2,
        createdAt: new Date(),
      };

      const original = encryptSecret(plaintext, oldKey);
      const rotated = rotateSecretEncryption(original.valueEncrypted, oldKey, newKey);

      expect(rotated.keyVersion).toBe(2);

      // Decrypt with new key
      const decrypted = decryptSecret(rotated.valueEncrypted, rotated.keyVersion, newKey);
      expect(decrypted.value).toBe(plaintext);
    });

    it('should fail if old key cannot decrypt', () => {
      const wrongKey = {
        key: Buffer.from(generateEncryptionKey(), 'hex'),
        version: 1,
        createdAt: new Date(),
      };
      const newKey = {
        key: Buffer.from(generateEncryptionKey(), 'hex'),
        version: 2,
        createdAt: new Date(),
      };

      const encrypted = encryptSecret('secret', testKey);

      expect(() => rotateSecretEncryption(encrypted.valueEncrypted, wrongKey, newKey)).toThrow();
    });
  });

  describe('getMasterKey', () => {
    const originalEnv = process.env.SECRETS_MASTER_KEY;

    afterEach(() => {
      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.SECRETS_MASTER_KEY = originalEnv;
      } else {
        delete process.env.SECRETS_MASTER_KEY;
      }
    });

    it('should throw if SECRETS_MASTER_KEY not set', () => {
      delete process.env.SECRETS_MASTER_KEY;
      expect(() => getMasterKey()).toThrow(InvalidKeyError);
      expect(() => getMasterKey()).toThrow('not found');
    });

    it('should throw if key is invalid length', () => {
      process.env.SECRETS_MASTER_KEY = 'abc123';
      expect(() => getMasterKey()).toThrow(InvalidKeyError);
      expect(() => getMasterKey()).toThrow('64 hex characters');
    });

    it('should throw if key is not valid hex', () => {
      process.env.SECRETS_MASTER_KEY = 'z'.repeat(64);
      expect(() => getMasterKey()).toThrow(InvalidKeyError);
    });

    it('should return valid key for valid input', () => {
      process.env.SECRETS_MASTER_KEY = generateEncryptionKey();
      const key = getMasterKey();
      expect(key.key.length).toBe(32);
      expect(key.version).toBe(1);
    });
  });
});

function afterEach(fn: () => void) {
  // Simple afterEach implementation for Node.js
  // In a real test environment, this would be handled by Jest
}
