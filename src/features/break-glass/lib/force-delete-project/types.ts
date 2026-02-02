/**
 * Force Delete Project Service - Type Definitions
 *
 * US-006: Implement Force Delete Power - Step 1: Foundation
 */

import type {
  DeletedProjectState,
  ForceDeleteActionLog,
  ForceDeleteProjectResponse,
  ForceDeleteProjectError,
  CleanupResources,
} from '../../types/force-delete-project.types'

/**
 * Force delete project operation parameters
 */
export interface ForceDeleteProjectParams {
  /** Project ID to force delete */
  projectId: string;

  /** Break glass session ID */
  sessionId: string;

  /** Admin ID performing the force delete */
  adminId: string;

  /** Optional reason/context for the force delete */
  reason?: string;

  /** Whether to clean up all associated resources (default: true) */
  cleanupResources?: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ field: string; message: string }>;
}

export type {
  DeletedProjectState,
  ForceDeleteActionLog,
  ForceDeleteProjectResponse,
  ForceDeleteProjectError,
  CleanupResources,
}
