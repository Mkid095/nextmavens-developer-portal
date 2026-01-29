import { getPool } from '@/lib/db'

/**
 * Migration: Add Key Lifecycle Columns to API Keys Table
 *
 * This migration adds lifecycle tracking columns to support key rotation and revocation:
 * - expires_at: TIMESTAMPTZ for automatic key expiration (nullable, for rotated keys)
 * - rotated_to: UUID reference to the new key after rotation (self-referential foreign key)
 * - usage_count: INTEGER counter for tracking how many times a key has been used
 *
 * Note: last_used already exists in the api_keys table, so we don't need to add it.
 */
export async function addKeyLifecycleColumns() {
  const pool = getPool()

  try {
    // Check if expires_at column exists
    const expiresAtCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'expires_at'
      )
    `)

    const expiresAtExists = expiresAtCheck.rows[0].exists

    if (!expiresAtExists) {
      // Add expires_at column as nullable TIMESTAMPTZ
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN expires_at TIMESTAMPTZ
      `)
      console.log('[Migration] Added expires_at column to api_keys table')
    } else {
      console.log('[Migration] expires_at column already exists')
    }

    // Check if rotated_to column exists
    const rotatedToCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'rotated_to'
      )
    `)

    const rotatedToExists = rotatedToCheck.rows[0].exists

    if (!rotatedToExists) {
      // Add rotated_to column as nullable UUID (references api_keys.id)
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN rotated_to UUID REFERENCES api_keys(id) ON DELETE SET NULL
      `)
      console.log('[Migration] Added rotated_to column to api_keys table')
    } else {
      console.log('[Migration] rotated_to column already exists')
    }

    // Check if usage_count column exists
    const usageCountCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'usage_count'
      )
    `)

    const usageCountExists = usageCountCheck.rows[0].exists

    if (!usageCountExists) {
      // Add usage_count column as INTEGER with default 0
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN usage_count INTEGER DEFAULT 0
      `)
      console.log('[Migration] Added usage_count column to api_keys table')

      // Initialize usage_count to 0 for existing keys
      await pool.query(`
        UPDATE api_keys
        SET usage_count = 0
        WHERE usage_count IS NULL
      `)
      console.log('[Migration] Initialized usage_count for existing keys')
    } else {
      console.log('[Migration] usage_count column already exists')
    }

    // Verify last_used column exists (it should already exist)
    const lastUsedCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'last_used'
      )
    `)

    const lastUsedExists = lastUsedCheck.rows[0].exists

    if (!lastUsedExists) {
      // Add last_used column if it doesn't exist
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN last_used TIMESTAMPTZ
      `)
      console.log('[Migration] Added last_used column to api_keys table')
    } else {
      console.log('[Migration] last_used column already exists')
    }

    // Create comments for documentation
    await pool.query(`
      COMMENT ON COLUMN api_keys.expires_at IS 'Timestamp for automatic key expiration. Set when key is rotated, allowing 24-hour grace period for old key.'
    `)

    await pool.query(`
      COMMENT ON COLUMN api_keys.rotated_to IS 'References the new API key after rotation. NULL for active keys that have not been rotated.'
    `)

    await pool.query(`
      COMMENT ON COLUMN api_keys.usage_count IS 'Counter tracking how many times this API key has been used. Incremented on each authenticated request.'
    `)

    await pool.query(`
      COMMENT ON COLUMN api_keys.last_used IS 'Timestamp of the last time this API key was used. Updated on each authenticated request.'
    `)

    console.log('[Migration] Added comments to key lifecycle columns')

    // Create index on expires_at for efficient expired key lookups
    const indexCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'api_keys'
        AND indexname = 'idx_api_keys_expires_at'
      )
    `)

    const indexExists = indexCheck.rows[0].exists

    if (!indexExists) {
      await pool.query(`
        CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at)
        WHERE expires_at IS NOT NULL
      `)
      console.log('[Migration] Created index on expires_at column')
    } else {
      console.log('[Migration] Index on expires_at already exists')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error adding key lifecycle columns to api_keys table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Remove key lifecycle columns
 *
 * This function removes the key lifecycle columns if needed for rollback.
 * WARNING: This will cause data loss of key lifecycle tracking information.
 */
export async function rollbackKeyLifecycleColumns() {
  const pool = getPool()

  try {
    // Drop columns in reverse order
    await pool.query(`
      ALTER TABLE api_keys
      DROP COLUMN IF EXISTS usage_count
    `)

    console.log('[Migration] Dropped usage_count column')

    await pool.query(`
      ALTER TABLE api_keys
      DROP COLUMN IF EXISTS rotated_to
    `)

    console.log('[Migration] Dropped rotated_to column')

    await pool.query(`
      ALTER TABLE api_keys
      DROP COLUMN IF EXISTS expires_at
    `)

    console.log('[Migration] Dropped expires_at column')

    // Drop index if it exists
    await pool.query(`
      DROP INDEX IF EXISTS idx_api_keys_expires_at
    `)

    console.log('[Migration] Dropped index on expires_at')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back key lifecycle columns:', error)
    return { success: false, error }
  }
}
