/**
 * Auto-Activation Job Module - Constants
 */

/**
 * SQL queries for auto-activation job
 */
export const SQL_QUERIES = {
  GET_CREATED_PROJECTS: `
    SELECT
      p.id,
      p.name as project_name,
      p.status,
      p.owner_id
    FROM control_plane.projects p
    WHERE p.status = 'created'
    ORDER BY p.created_at ASC
  `,

  ACTIVATE_PROJECT: `
    UPDATE control_plane.projects
    SET status = 'active', updated_at = NOW()
    WHERE id = $1
  `,

  GET_PROJECTS_READY_FOR_ACTIVATION: `
    SELECT DISTINCT
      p.id as project_id,
      p.name as project_name,
      u.name as owner_name,
      p.created_at
    FROM control_plane.projects p
    INNER JOIN control_plane.users u ON p.owner_id = u.id
    WHERE p.status = 'created'
      AND NOT EXISTS (
        SELECT 1 FROM provisioning_steps ps
        WHERE ps.project_id = p.id
        AND ps.status NOT IN ('success', 'skipped')
      )
    ORDER BY p.created_at ASC
  `,
} as const

/**
 * Log prefixes for console logging
 */
export const LOG_PREFIXES = {
  HEADER: '='.repeat(60),
  START: '[Auto-Activation Job]',
  NO_PROJECTS: '[Auto-Activation Job] No CREATED projects found',
  FOUND_PROJECTS: '[Auto-Activation Job] Found',
  CREATED_PROJECTS: 'CREATED projects',
  NO_STEPS: '[Auto-Activation Job] Project',
  NO_STEPS_MSG: 'No provisioning steps found, skipping',
  COMPLETE: '[Auto-Activation Job] Project',
  COMPLETE_MSG: 'Provisioning complete, activating...',
  INVALID_TRANSITION: '[Auto-Activation Job] Invalid transition: CREATED → ACTIVE',
  ACTIVATED: '[Auto-Activation Job] ✓ Activated project',
  FAILED: '[Auto-Activation Job] Project',
  FAILED_MSG: 'Provisioning failed, skipping',
  IN_PROGRESS: '[Auto-Activation Job] Project',
  IN_PROGRESS_MSG: 'Provisioning in progress',
  JOB_COMPLETE: '[Auto-Activation Job] Completed',
  DURATION: '[Auto-Activation Job] Duration:',
  PROJECTS_CHECKED: '[Auto-Activation Job] Projects checked:',
  PROJECTS_ACTIVATED: '[Auto-Activation Job] Projects activated:',
  FAILED_PROVISIONING: '[Auto-Activation Job] Failed provisioning:',
  ACTIVATED_PROJECTS: '[Auto-Activation Job] Activated projects:',
  JOB_FAILED: '[Auto-Activation Job] Failed',
  ERROR_PROCESSING: '[Auto-Activation Job] Error processing project',
  LOG_FAILED: '[Auto-Activation Job] Failed to log activation for',
  ERROR_GETTING: '[Auto-Activation Job] Error getting projects ready for activation:',
} as const

/**
 * Audit log action metadata
 */
export const AUDIT_METADATA = {
  action: 'auto_activated',
  previous_status: 'created',
  new_status: 'active',
  reason: 'Provisioning completed successfully',
} as const

/**
 * System actor request metadata
 */
export const SYSTEM_REQUEST = {
  ip: 'system',
  userAgent: 'auto-activation-job',
} as const
