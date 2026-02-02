/**
 * Admin Database Module - Type Definitions
 *
 * US-003: Implement Break Glass Authentication
 */

/**
 * Admin access methods
 */
export enum AdminAccessMethod {
  HARDWARE_KEY = 'hardware_key',
  OTP = 'otp',
  EMERGENCY_CODE = 'emergency_code',
}

/**
 * Admin action types
 */
export enum AdminActionType {
  UNLOCK_PROJECT = 'unlock_project',
  OVERRIDE_SUSPENSION = 'override_suspension',
  FORCE_DELETE = 'force_delete',
  REGENERATE_KEYS = 'regenerate_keys',
  ACCESS_PROJECT = 'access_project',
  OVERRIDE_QUOTA = 'override_quota',
  EMERGENCY_ACTION = 'emergency_action',
}

/**
 * Target types for admin actions
 */
export enum AdminTargetType {
  PROJECT = 'project',
  API_KEY = 'api_key',
  DEVELOPER = 'developer',
  SUSPENSION = 'suspension',
  QUOTA = 'quota',
  SYSTEM = 'system',
}

/**
 * Admin session record from database
 */
export interface AdminSession {
  id: string;
  admin_id: string;
  reason: string;
  access_method: AdminAccessMethod;
  granted_by: string | null;
  expires_at: Date;
  created_at: Date;
}

/**
 * Admin action record from database
 */
export interface AdminAction {
  id: string;
  session_id: string;
  action: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  created_at: Date;
}

/**
 * Parameters for creating a new admin session
 */
export interface CreateAdminSessionParams {
  admin_id: string;
  reason: string;
  access_method: AdminAccessMethod;
  granted_by?: string;
  expires_in_hours?: number;
}

/**
 * Parameters for logging an admin action
 */
export interface LogAdminActionParams {
  session_id: string;
  action: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
}

/**
 * Result of validating an admin session
 */
export interface AdminSessionValidation {
  valid: boolean;
  reason?: 'not_found' | 'expired';
  session?: AdminSession;
  expires_in_seconds?: number;
  /** Warning when session is about to expire (within 5 minutes) */
  warning?: 'expiring_soon';
  /** ISO timestamp when session expires */
  expires_at?: string;
}
