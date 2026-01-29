/**
 * Regenerate System Keys Power Type Definitions
 *
 * Defines the types and interfaces for the regenerate keys break glass power.
 *
 * US-007: Implement Regenerate System Keys Power
 */

/**
 * Invalidated API key state
 */
export interface InvalidatedKey {
  id: string;
  name: string;
  key_type: string;
  key_prefix: string;
  invalidated_at: Date;
}

/**
 * Generated service role key
 */
export interface GeneratedServiceRoleKey {
  id: string;
  key_type: 'service_role';
  key_prefix: string;
  secret_key: string;
  scopes: string[];
  environment: string;
  created_at: Date;
  show_once_warning: string;
}

/**
 * Keys state after regeneration
 */
export interface RegeneratedKeysState {
  project_id: string;
  project_name: string;
  keys_invalidated: number;
  invalidated_keys: InvalidatedKey[];
  new_keys_generated: number;
  new_service_role_keys: GeneratedServiceRoleKey[];
  regenerated_at: Date;
}

/**
 * Regenerate keys action log entry
 */
export interface RegenerateKeysActionLog {
  id: string;
  session_id: string;
  action: string;
  target_type: string;
  target_id: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  logged_at: Date;
}

/**
 * Regenerate keys response
 */
export interface RegenerateKeysResponse {
  success: true;
  project: {
    id: string;
    name: string;
  };
  keys_state: RegeneratedKeysState;
  action_log: RegenerateKeysActionLog;
  warning?: string;
}

/**
 * Regenerate keys error response
 */
export interface RegenerateKeysError {
  error: string;
  details?: string;
  code?: 'PROJECT_NOT_FOUND' | 'REGENERATE_FAILED' | 'INVALID_TOKEN';
}

/**
 * Regenerate keys request
 */
export interface RegenerateKeysRequest {
  /** Break glass session token (can be in body or Authorization header) */
  break_glass_token?: string;

  /** Optional reason/context for the regeneration */
  reason?: string;

  /** Whether to invalidate all existing keys (default: true) */
  invalidate_all?: boolean;

  /** Number of service_role keys to generate (default: 1) */
  key_count?: number;

  /** Environment for new keys (default: 'live') */
  environment?: 'live' | 'test' | 'dev';
}
