/**
 * Create audit_logs table
 *
 * This table stores security audit logs for all abuse control operations.
 * Provides a comprehensive audit trail for compliance and security monitoring.
 */

export function up() {
  return `
    -- Create audit_logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      log_type VARCHAR(50) NOT NULL,
      severity VARCHAR(20) NOT NULL,
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
      action VARCHAR(255) NOT NULL,
      details JSONB NOT NULL DEFAULT '{}',
      ip_address INET,
      user_agent TEXT,
      occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

      -- Indexes for querying
      CONSTRAINT audit_logs_log_type_check CHECK (log_type IN (
        'suspension',
        'unsuspension',
        'auth_failure',
        'rate_limit_exceeded',
        'validation_failure',
        'background_job',
        'manual_intervention'
      )),
      CONSTRAINT audit_logs_severity_check CHECK (severity IN (
        'info',
        'warning',
        'error',
        'critical'
      ))
    );

    -- Create indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_developer_id ON audit_logs(developer_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_log_type ON audit_logs(log_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);

    -- Create composite index for common queries
    CREATE INDEX IF NOT EXISTS idx_audit_logs_project_occurred_at
      ON audit_logs(project_id, occurred_at DESC);

    -- Create index for filtering by log type and time range
    CREATE INDEX IF NOT EXISTS idx_audit_logs_type_occurred_at
      ON audit_logs(log_type, occurred_at DESC);

    -- Add comment for documentation
    COMMENT ON TABLE audit_logs IS 'Security audit logs for abuse control operations';
    COMMENT ON COLUMN audit_logs.log_type IS 'Type of audit log entry (suspension, auth_failure, etc.)';
    COMMENT ON COLUMN audit_logs.severity IS 'Severity level (info, warning, error, critical)';
    COMMENT ON COLUMN audit_logs.details IS 'Additional details about the event in JSON format';
    COMMENT ON COLUMN audit_logs.occurred_at IS 'When the event occurred';
  `
}

export function down() {
  return `
    DROP INDEX IF EXISTS idx_audit_logs_type_occurred_at;
    DROP INDEX IF EXISTS idx_audit_logs_project_occurred_at;
    DROP INDEX IF EXISTS idx_audit_logs_occurred_at;
    DROP INDEX IF EXISTS idx_audit_logs_severity;
    DROP INDEX IF EXISTS idx_audit_logs_log_type;
    DROP INDEX IF EXISTS idx_audit_logs_developer_id;
    DROP INDEX IF EXISTS idx_audit_logs_project_id;
    DROP TABLE IF EXISTS audit_logs;
  `
}
