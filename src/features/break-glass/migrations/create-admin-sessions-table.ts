/**
 * Create admin_sessions table
 *
 * This table stores break glass session information for emergency access tracking.
 * Each session represents a time-limited admin session with full audit logging.
 *
 * US-001: Create Admin Sessions Table (Break Glass Mode)
 */

export function up() {
  return `
    -- Create admin_sessions table
    CREATE TABLE IF NOT EXISTS control_plane.admin_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      access_method VARCHAR(50) NOT NULL,
      granted_by UUID REFERENCES developers(id) ON DELETE SET NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

      -- Constraints
      CONSTRAINT admin_sessions_access_method_check CHECK (access_method IN (
        'hardware_key',
        'otp',
        'emergency_code'
      ))
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON control_plane.admin_sessions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON control_plane.admin_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_created_at ON control_plane.admin_sessions(created_at DESC);

    -- Create index for active sessions (not expired)
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_active
      ON control_plane.admin_sessions(admin_id, expires_at)
      WHERE expires_at > NOW();

    -- Add comments for documentation
    COMMENT ON TABLE control_plane.admin_sessions IS 'Break glass session tracking for emergency admin access';
    COMMENT ON COLUMN control_plane.admin_sessions.id IS 'Session UUID used as break glass token';
    COMMENT ON COLUMN control_plane.admin_sessions.admin_id IS 'Developer ID who initiated break glass';
    COMMENT ON COLUMN control_plane.admin_sessions.reason IS 'Reason for emergency access';
    COMMENT ON COLUMN control_plane.admin_sessions.access_method IS 'How authentication was performed (hardware_key, otp, emergency_code)';
    COMMENT ON COLUMN control_plane.admin_sessions.granted_by IS 'Developer who granted access (if self-granted, same as admin_id)';
    COMMENT ON COLUMN control_plane.admin_sessions.expires_at IS 'When this session expires (1 hour from creation)';
    COMMENT ON COLUMN control_plane.admin_sessions.created_at IS 'When this session was created';
  `
}

export function down() {
  return `
    DROP INDEX IF EXISTS control_plane.idx_admin_sessions_active;
    DROP INDEX IF EXISTS control_plane.idx_admin_sessions_created_at;
    DROP INDEX IF EXISTS control_plane.idx_admin_sessions_expires_at;
    DROP INDEX IF EXISTS control_plane.idx_admin_sessions_admin_id;
    DROP TABLE IF EXISTS control_plane.admin_sessions;
  `
}
