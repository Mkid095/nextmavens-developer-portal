import { getPool } from '@/lib/db'

/**
 * Migration: Add Key Type and Scopes to API Keys Table
 *
 * This migration enhances the api_keys table to support different key types
 * and granular scope-based permissions:
 * - key_type: Enum to distinguish between public, secret, service_role, and mcp keys
 * - scopes: JSONB array to store granular permissions (e.g., db:select, storage:read)
 * - environment: Enum to track which environment the key is for (live, test, dev)
 *
 * The migration also handles backwards compatibility by migrating existing keys
 * to appropriate types based on their current key_type value.
 */
export async function addKeyTypeAndScopesToApiKeys() {
  const pool = getPool()

  try {
    // Create enum type for key_type if it doesn't exist
    const keyTypeEnumCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'api_key_type'
      )
    `)

    const keyTypeEnumExists = keyTypeEnumCheck.rows[0].exists

    if (!keyTypeEnumExists) {
      await pool.query(`
        CREATE TYPE api_key_type AS ENUM ('public', 'secret', 'service_role', 'mcp')
      `)
      console.log('[Migration] Created api_key_type enum')
    } else {
      console.log('[Migration] api_key_type enum already exists')
    }

    // Create enum type for environment if it doesn't exist
    const envEnumCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'api_key_environment'
      )
    `)

    const envEnumExists = envEnumCheck.rows[0].exists

    if (!envEnumExists) {
      await pool.query(`
        CREATE TYPE api_key_environment AS ENUM ('live', 'test', 'dev')
      `)
      console.log('[Migration] Created api_key_environment enum')
    } else {
      console.log('[Migration] api_key_environment enum already exists')
    }

    // Check if key_type column exists (might be VARCHAR, need to convert)
    const keyTypeCheck = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'api_keys'
      AND column_name = 'key_type'
    `)

    if (keyTypeCheck.rows.length === 0) {
      // Add key_type column as enum
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN key_type api_key_type DEFAULT 'public'
      `)
      console.log('[Migration] Added key_type column to api_keys table')
    } else {
      const currentKeyType = keyTypeCheck.rows[0]
      // If it's VARCHAR, we need to convert to enum
      if (currentKeyType.data_type === 'character varying' || currentKeyType.udt_name === 'varchar') {
        // First migrate existing data to temporary column
        await pool.query(`
          ALTER TABLE api_keys
          ADD COLUMN IF NOT EXISTS key_type_new api_key_type
        `)

        // Migrate existing values
        await pool.query(`
          UPDATE api_keys
          SET key_type_new = CASE
            WHEN key_type = 'public' THEN 'public'::api_key_type
            WHEN key_type = 'secret' THEN 'secret'::api_key_type
            WHEN key_type = 'service_role' THEN 'service_role'::api_key_type
            WHEN key_type = 'mcp' THEN 'mcp'::api_key_type
            ELSE 'public'::api_key_type
          END
          WHERE key_type IS NOT NULL
        `)

        // Drop old column and rename new one
        await pool.query(`
          ALTER TABLE api_keys
          DROP COLUMN key_type
        `)

        await pool.query(`
          ALTER TABLE api_keys
          RENAME COLUMN key_type_new TO key_type
        `)

        await pool.query(`
          ALTER TABLE api_keys
          ALTER COLUMN key_type SET DEFAULT 'public'
        `)

        await pool.query(`
          ALTER TABLE api_keys
          ALTER COLUMN key_type SET NOT NULL
        `)

        console.log('[Migration] Converted key_type from VARCHAR to api_key_type enum')
      } else if (currentKeyType.udt_name !== 'api_key_type') {
        console.log('[Migration] key_type column exists but is not the correct type:', currentKeyType.udt_name)
      } else {
        console.log('[Migration] key_type column already exists as enum')
      }
    }

    // Check if scopes column exists
    const scopesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'scopes'
      )
    `)

    const scopesExists = scopesCheck.rows[0].exists

    if (!scopesExists) {
      // Add scopes column as JSONB
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN scopes JSONB DEFAULT '[]'::jsonb
      `)
      console.log('[Migration] Added scopes column to api_keys table')

      // Set default scopes based on key_type
      await pool.query(`
        UPDATE api_keys
        SET scopes = CASE
          WHEN key_type = 'public' THEN '["db:select", "storage:read", "auth:signin", "realtime:subscribe"]'::jsonb
          WHEN key_type = 'secret' THEN '["db:select", "db:insert", "db:update", "db:delete", "storage:read", "storage:write", "auth:manage", "graphql:execute"]'::jsonb
          WHEN key_type = 'service_role' THEN '["db:select", "db:insert", "db:update", "db:delete", "storage:read", "storage:write", "auth:manage", "graphql:execute", "realtime:subscribe", "realtime:publish"]'::jsonb
          WHEN key_type = 'mcp' THEN '["db:select", "db:insert", "db:update", "db:delete", "storage:read", "storage:write", "graphql:execute"]'::jsonb
          ELSE '[]'::jsonb
        END
        WHERE scopes = '[]'::jsonb
      `)
      console.log('[Migration] Set default scopes for existing keys')
    } else {
      console.log('[Migration] scopes column already exists')
    }

    // Check if environment column exists
    const environmentCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'api_keys'
        AND column_name = 'environment'
      )
    `)

    const environmentExists = environmentCheck.rows[0].exists

    if (!environmentExists) {
      // Add environment column
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN environment api_key_environment DEFAULT 'live'
      `)
      console.log('[Migration] Added environment column to api_keys table')

      // Set environment based on key_prefix
      await pool.query(`
        UPDATE api_keys
        SET environment = CASE
          WHEN key_prefix LIKE '%_live_%' THEN 'live'::api_key_environment
          WHEN key_prefix LIKE '%_test_%' THEN 'test'::api_key_environment
          WHEN key_prefix LIKE '%_dev_%' THEN 'dev'::api_key_environment
          ELSE 'live'::api_key_environment
        END
      `)
      console.log('[Migration] Set environment based on key_prefix for existing keys')
    } else {
      console.log('[Migration] environment column already exists')
    }

    // Create comments for documentation
    await pool.query(`
      COMMENT ON COLUMN api_keys.key_type IS 'Type of API key: public (client-side, read-only), secret (server-side, full CRUD), service_role (admin, bypasses RLS), mcp (AI tools)'
    `)

    await pool.query(`
      COMMENT ON COLUMN api_keys.scopes IS 'Granular permissions as JSONB array. Examples: db:select, storage:read, auth:signin, realtime:subscribe'
    `)

    await pool.query(`
      COMMENT ON COLUMN api_keys.environment IS 'Environment for the key: live (production), test (staging), dev (development)'
    `)

    console.log('[Migration] Added comments to enhanced API key columns')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error adding key_type, scopes, and environment to api_keys table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Remove enhanced API key columns
 *
 * This function removes the enhanced API key columns if needed for rollback.
 * WARNING: This will cause data loss of scope and environment information.
 */
export async function rollbackKeyTypeAndScopes() {
  const pool = getPool()

  try {
    // Drop columns in reverse order
    await pool.query(`
      ALTER TABLE api_keys
      DROP COLUMN IF EXISTS environment
    `)

    console.log('[Migration] Dropped environment column')

    await pool.query(`
      ALTER TABLE api_keys
      DROP COLUMN IF EXISTS scopes
    `)

    console.log('[Migration] Dropped scopes column')

    // Convert key_type back to VARCHAR if needed
    const keyTypeCheck = await pool.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'api_keys'
      AND column_name = 'key_type'
    `)

    if (keyTypeCheck.rows.length > 0) {
      const currentKeyType = keyTypeCheck.rows[0]
      if (currentKeyType.udt_name === 'api_key_type') {
        // Convert back to VARCHAR
        await pool.query(`
          ALTER TABLE api_keys
          ADD COLUMN IF NOT EXISTS key_type_new VARCHAR(20)
        `)

        await pool.query(`
          UPDATE api_keys
          SET key_type_new = key_type::text
        `)

        await pool.query(`
          ALTER TABLE api_keys
          DROP COLUMN key_type
        `)

        await pool.query(`
          ALTER TABLE api_keys
          RENAME COLUMN key_type_new TO key_type
        `)

        console.log('[Migration] Converted key_type from enum to VARCHAR')
      } else {
        await pool.query(`
          ALTER TABLE api_keys
          DROP COLUMN IF EXISTS key_type
        `)
        console.log('[Migration] Dropped key_type column')
      }
    }

    // Drop enum types
    await pool.query(`
      DROP TYPE IF EXISTS api_key_environment
    `)

    console.log('[Migration] Dropped api_key_environment enum')

    await pool.query(`
      DROP TYPE IF EXISTS api_key_type
    `)

    console.log('[Migration] Dropped api_key_type enum')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error rolling back key_type and scopes:', error)
    return { success: false, error }
  }
}
