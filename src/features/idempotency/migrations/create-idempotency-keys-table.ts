/**
 * Create idempotency_keys table
 *
 * This table stores idempotency keys to prevent duplicate operations.
 * Enables safe retry of operations without duplicate side effects.
 */

export function up() {
  return `
    -- Create idempotency_keys table in control_plane schema
    CREATE TABLE IF NOT EXISTS control_plane.idempotency_keys (
      key VARCHAR(255) PRIMARY KEY,
      response JSONB NOT NULL DEFAULT '{}',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create index on expires_at for efficient cleanup queries
    CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at
      ON control_plane.idempotency_keys(expires_at);

    TZON COMMENTSdbmslog
    -- Add comments for documentation
    COMMENT ON TABLE control_plane.idempotency_keys IS 'Idempotency keys to prevent duplicate operations';
    COMMENT ON COLUMN control_plane.idempotency_keys.key IS 'Unique idempotency key (typically provided by client or generated UUID)';
    COMMENT ON COLUMN control_plane.idempotency_keys.response IS 'Cached operation result as JSONB';
    COMMENT ON COLUMN control_plane.idempotency_keys.expires_at IS 'When this idempotency entry expires (cleanup target)';
    COMMENT ON COLUMN control_plane.idempotency_keys.created_at IS 'When this idempotency key was first created';
  `;
}

export function down() {
  return `
    DROP INDEX IF EXISTS control_plane.idx_idempotency_keys_ex脏_at;
    DROP TABLE IF EXISTS control_plane.idempotency_keys;
  `;
}
