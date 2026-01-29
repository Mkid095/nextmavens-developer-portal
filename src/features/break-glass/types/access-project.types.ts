/**
 * Access Project Power - Break Glass Mode
 *
 * Type definitions for the access project break glass power.
 * Allows platform operators to access ANY project details using break glass,
 * bypassing normal ownership checks for investigation purposes.
 *
 * US-008: Implement Access Any Project Power
 */

/**
 * Full project details returned by access project power
 */
export interface FullProjectDetails {
  /** Project ID */
  id: string;

  /** Project name */
  name: string;

  /** Tenant ID */
  tenant_id: string;

  /** Tenant slug */
  tenant_slug: string;

  /** Developer ID who owns the project */
  developer_id: string;

  /** Project status (ACTIVE, SUSPENDED, ARCHIVED, DELETED) */
  status: string;

  /** Webhook URL */
  webhook_url: string | null;

  /** Allowed origins for CORS */
  allowed_origins: string[];

  /** Rate limit configuration */
  rate_limit: number | null;

  /** Environment (live, test, dev) */
  environment: string | null;

  /** When project was created */
  created_at: Date;

  /** When project was last updated */
  updated_at: Date;

  /** Suspension information (if applicable) */
  suspension?: SuspensionDetails;

  /** Hard caps configuration */
  hard_caps?: HardCapsConfig;

  /** API keys count */
  api_keys_count?: number;

  /** Service accounts count */
  service_accounts_count?: number;
}

/**
 * Suspension details
 */
export interface SuspensionDetails {
  /** Whether project is suspended */
  suspended: boolean;

  /** Which cap was exceeded (if applicable) */
  cap_exceeded?: string;

  /** Reason for suspension */
  reason?: string;

  /** When suspension occurred */
  suspended_at?: Date;

  /** Suspension notes */
  notes?: string;
}

/**
 * Hard caps configuration
 */
export interface HardCapsConfig {
  /** Max database queries per day */
  db_queries_per_day?: number;

  /** Max realtime connections */
  realtime_connections?: number;

  /** Max storage uploads per day */
  storage_uploads_per_day?: number;

  /** Max function invocations per day */
  function_invocations_per_day?: number;
}

/**
 * Access project response
 */
export interface AccessProjectResponse {
  /** Whether access was successful */
  success: true;

  /** Full project details */
  project: FullProjectDetails;

  /** Access log */
  access_log: ProjectAccessLog;

  /** Admin session info */
  session: {
    /** Session ID */
    id: string;

    /** Admin ID */
    admin_id: string;

    /** Session reason */
    reason: string;

    /** Access method used */
    access_method: string;

    /** When session expires */
    expires_at: string;
  };
}

/**
 * Project access log entry
 */
export interface ProjectAccessLog {
  /** Log entry ID */
  id: string;

  /** Break glass session ID */
  session_id: string;

  /** Action performed */
  action: string;

  /** Target type */
  target_type: string;

  /** Target ID (project ID) */
  target_id: string;

  /** State before access (snapshot) */
  before_state: Record<string, unknown>;

  /** State after access (should be same - read-only) */
  after_state: Record<string, unknown>;

  /** When access was logged */
  logged_at: Date;
}

/**
 * Access project error response
 */
export interface AccessProjectError {
  /** Error message */
  error: string;

  /** Error details */
  details?: string;

  /** Error code */
  code: 'PROJECT_NOT_FOUND' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'ACCESS_FAILED';

  /** Additional error context */
  context?: Record<string, unknown>;
}

/**
 * Access history entry
 */
export interface AccessHistoryEntry {
  /** Log entry ID */
  id: string;

  /** Session ID */
  session_id: string;

  /** Admin ID */
  admin_id: string;

  /** Session reason */
  session_reason: string;

  /** When accessed */
  accessed_at: Date;

  /** IP address of admin */
  ip_address?: string;

  /** User agent of admin */
  user_agent?: string;
}

/**
 * Access history response
 */
export interface AccessHistoryResponse {
  /** Project ID */
  project_id: string;

  /** Total access count */
  access_count: number;

  /** Access history entries */
  history: AccessHistoryEntry[];
}
