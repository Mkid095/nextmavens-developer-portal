/**
 * Create admin_actions table
 *
 * This table stores all break glass actions with full context.
 * Each action is linked to an admin session and captures before/after states.
 *
 * US-002: Create Admin Actions Table (Break Glass Mode)
 */

export function up() {
  return `
    -- Create admin_actions table
    CREATE TABLE IF NOT EXISTS control_plane.admin_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES control_plane.admin_sessions(id) ON DELETE CASCADE,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50) NOT NULL,
      target_id UUID NOT NULL,
      before_state JSONB NOT NULL DEFAULT '{}',
      after_state JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

      -- Constraints
      CONSTRAINT admin_actions_action_check CHECK (action IN (
        'unlock_project',
        'override_suspension',
        'force_delete',
        'regenerate_keys',
        'access_project',
        'override_quota',
        'emergency_action'
      )),
      CONSTRAINT admin_actions_target_type_check CHECK (target_type IN (
        'project',
        'api_key',
        'developer',
        'suspension',
        'quota',
        'system'
      ))
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_admin_actions_session_id ON control_plane.admin_actions(session_id);
    CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON control_plane.admin_actions(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_admin_actions_action ON control_plane.admin_actions(action);
    CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON control_plane.admin_actions(created_at DESC);

    -- Create composite index for session history
    CREATE INDEX IF NOT EXISTS idx_admin_actions_session_created
      ON control_plane.admin_actions(session_id, created_at DESC);

    -- Create index for querying actions on a specific target
    CREATE INDEX IF NOT EXISTS idx_admin_actions_target_created
      ON control_plane.admin_actions(target_type, target_id, created_at DESC);

    -- Add comments for documentation
    COMMENT ON TABLE control_plane.admin_actions IS 'Break glass action log with before/after states';
    COMMENT ON COLUMN control_plane.admin_actions.id IS 'Action UUID';
    COMMENT ON COLUMN control_plane.admin_actions.session_id IS 'Reference to admin_sessions (links action to session)';
    COMMENT ON COLUMN control_plane.admin_actions.action IS 'Type of action performed (unlock_project, override_suspension, etc.)';
    COMMENT ON COLUMN control_plane.admin_actions.target_type IS 'Type of target (project, api_key, developer, etc.)';
    COMMENT ON COLUMN control_plane.admin_actions.target_id IS 'ID of the target resource';
    COMMENT ON COLUMN control_plane.admin_actions.before_state IS 'Full system state before action (JSONB)';
    COMMENT ON COLUMN control_plane.admin_actions.after_state IS 'Full system state after action (JSONB)';
    COMMENT ON COLUMN control_plane.admin_actions.created_at IS 'When the action was performed';
  `
}

export function down() {
  return `
    DROP INDEX IF EXISTS control_plane.idx_admin_actions_target_created;
    DROP INDEX IF EXISTS control_plane.idx_admin_actions_session_created;
    DROP INDEX IF EXISTS control_plane.idx_admin_actions_created_at;
    DROP INDEX IF EXISTS control_plane.idx_admin_actions_action;
    DROP INDEX IF EXISTS control_plane.idx_admin_actions_target;
    DROP INDEX IF EXISTS control_plane.idx_admin_actions_session_id;
    DROP TABLE IF EXISTS control_plane.admin_actions;
  `
}
