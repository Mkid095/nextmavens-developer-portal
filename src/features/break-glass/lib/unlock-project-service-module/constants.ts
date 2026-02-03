/**
 * Unlock Project Service - Module - Constants
 */

export const ERROR_MESSAGES = {
  PROJECT_NOT_FOUND: (id: string) => `Project with ID ${id} does not exist`,
  INVALID_PARAMS: 'Invalid unlock request parameters',
} as const

export const VALIDATION_ERRORS = {
  PROJECT_ID_REQUIRED: 'Project ID is required and must be a string',
  SESSION_ID_REQUIRED: 'Session ID is required and must be a string',
  ADMIN_ID_REQUIRED: 'Admin ID is required and must be a string',
} as const

export const WARNINGS = {
  ALREADY_ACTIVE: 'Project was already ACTIVE and had no suspension',
} as const

export const QUERIES = {
  GET_PROJECT: `
    SELECT
      p.id,
      p.project_name,
      p.status,
      p.tenant_id,
      p.developer_id,
      p.created_at
    FROM projects p
    WHERE p.id = $1
  `,
  UPDATE_PROJECT_STATUS: `
    UPDATE projects
    SET status = 'ACTIVE',
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, project_name, status, updated_at
  `,
  GET_UNLOCK_HISTORY: `
    SELECT
      aa.id,
      aa.session_id,
      aa.action,
      aa.target_type,
      aa.target_id,
      aa.before_state,
      aa.after_state,
      aa.created_at
    FROM control_plane.admin_actions aa
    WHERE aa.action = $1
      AND aa.target_type = 'project'
      AND aa.target_id = $2
    ORDER BY aa.created_at DESC
  `,
} as const
