/**
 * Create Secret Modal - Validation Functions
 */

import type { ValidationResult } from './types'

/**
 * Validate secret name
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: 'Secret name is required' }
  }
  if (name.length > 255) {
    return { valid: false, error: 'Secret name must be less than 255 characters' }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return {
      valid: false,
      error: 'Secret name can only contain letters, numbers, hyphens, and underscores',
    }
  }
  return { valid: true, error: null }
}

/**
 * Validate secret value
 */
export function validateValue(value: string): ValidationResult {
  if (!value) {
    return { valid: false, error: 'Secret value is required' }
  }
  if (value.length > 10000) {
    return { valid: false, error: 'Secret value must be less than 10,000 characters' }
  }
  return { valid: true, error: null }
}
