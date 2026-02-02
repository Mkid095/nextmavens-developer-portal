/**
 * Access Project Service - Type Definitions
 *
 * US-008: Implement Access Any Project Power
 */

import type {
  FullProjectDetails,
  AccessProjectResponse,
  ProjectAccessLog,
  AccessHistoryEntry,
} from '../../../types/access-project.types'

/**
 * Access project operation parameters
 */
export interface AccessProjectParams {
  /** Project ID to access */
  projectId: string;

  /** Break glass session ID */
  sessionId: string;

  /** Admin ID performing the access */
  adminId: string;

  /** Optional IP address of admin */
  ipAddress?: string;

  /** Optional user agent of admin */
  userAgent?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ field: string; message: string }>;
}

export type {
  FullProjectDetails,
  AccessProjectResponse,
  ProjectAccessLog,
  AccessHistoryEntry,
}
