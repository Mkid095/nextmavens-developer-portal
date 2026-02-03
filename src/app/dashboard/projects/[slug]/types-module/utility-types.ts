/**
 * Project Types Module - Utility Types
 */

/**
 * Environment option for API key creation
 */
export interface EnvironmentOption {
  value: 'live' | 'test' | 'dev'
  label: string
  prefix: string
}

/**
 * Available environment options
 */
export const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  { value: 'live', label: 'Production (Live)', prefix: 'pk_live_' },
  { value: 'test', label: 'Staging (Test)', prefix: 'pk_test_' },
  { value: 'dev', label: 'Development (Dev)', prefix: 'pk_dev_' },
]
