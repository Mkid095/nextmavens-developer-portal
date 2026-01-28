/**
 * Add role column to developers table
 *
 * This migration adds a role column to the developers table
 * to support operator and admin privileges.
 */

export function up() {
  return `
    -- Add role column to developers table
    ALTER TABLE developers
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'developer';

    -- Create check constraint for valid roles
    ALTER TABLE developers
    ADD CONSTRAINT developers_role_check
    CHECK (role IN ('developer', 'operator', 'admin'));

    -- Create index for role-based queries
    CREATE INDEX IF NOT EXISTS idx_developers_role
      ON developers(role);

    -- Add comments for documentation
    COMMENT ON COLUMN developers.role IS 'User role: developer, operator, or admin';
  `
}

export function down() {
  return `
    DROP INDEX IF EXISTS idx_developers_role;
    ALTER TABLE developers DROP CONSTRAINT IF EXISTS developers_role_check;
    ALTER TABLE developers DROP COLUMN IF EXISTS role;
  `
}
