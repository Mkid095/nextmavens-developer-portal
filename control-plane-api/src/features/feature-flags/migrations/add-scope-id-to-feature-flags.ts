import { getPool } from '@/lib/db'

/**
 * Migration US-011: Add scope_id column to feature_flags table
 *
 * This migration adds support for project-level and org-level feature flags.
 * The scope_id column stores the project_id or org_id for scoped flags.
 * The primary key is updated to (name, scope, scope_id) to allow multiple
 * flags with the same name at different scopes.
 */
export async function up() {
  const pool = getPool()

  try {
    // Check if scope_id column already exists
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'control_plane'
        AND table_name = 'feature_flags'
        AND column_name = 'scope_id'
      )
    `)

    const columnExists = columnCheck.rows[0].exists

    if (!columnExists) {
      // Step 1: Add scope_id column (nullable initially)
      await pool.query(`
        ALTER TABLE control_plane.feature_flags
        ADD COLUMN scope_id VARCHAR(100);
      `)
      console.log('[Migration] Added scope_id column to feature_flags table')

      // Step 2: Set scope_id to 'global' for existing global flags
      await pool.query(`
        UPDATE control_plane.feature_flags
        SET scope_id = 'global'
        WHERE scope = 'global';
      `)
      console.log('[Migration] Set scope_id for existing global flags')

      // Step 3: Make scope_id NOT NULL
      await pool.query(`
        ALTER TABLE control_plane.feature_flags
        ALTER COLUMN scope_id SET NOT NULL;
      `)
      console.log('[Migration] Made scope_id NOT NULL')

      // Step 4: Drop the old primary key (name only)
      await pool.query(`
        ALTER TABLE control_plane.feature_flags
        DROP CONSTRAINT feature_flags_pkey;
      `)
      console.log('[Migration] Dropped old primary key')

      // Step 5: Add new composite primary key (name, scope, scope_id)
      await pool.query(`
        ALTER TABLE control_plane.feature_flags
        ADD PRIMARY KEY (name, scope, scope_id);
      `)
      console.log('[Migration] Added composite primary key (name, scope, scope_id)')

      // Step 6: Update the CHECK constraint to match the new pattern
      await pool.query(`
        ALTER TABLE control_plane.feature_flags
        DROP CONSTRAINT IF EXISTS feature_flags_scope_check;
      `)
      await pool.query(`
        ALTER TABLE control_plane.feature_flags
        ADD CONSTRAINT feature_flags_scope_check
        CHECK (
          (scope = 'global' AND scope_id = 'global') OR
          (scope = 'project' AND scope_id ~ '^proj_[a-z0-9]+$') OR
          (scope = 'org' AND scope_id ~ '^org_[a-z0-9]+$')
        );
      `)
      console.log('[Migration] Updated scope check constraint')

      // Step 7: Add index on scope_id for efficient queries
      const scopeIdIndexCheck = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = 'control_plane'
          AND indexname = 'idx_feature_flags_scope_id'
        )
      `)

      if (!scopeIdIndexCheck.rows[0].exists) {
        await pool.query(`
          CREATE INDEX idx_feature_flags_scope_id
          ON control_plane.feature_flags(scope_id);
        `)
        console.log('[Migration] Created idx_feature_flags_scope_id index')
      }

      // Step 8: Add comment for scope_id column
      await pool.query(`
        COMMENT ON COLUMN control_plane.feature_flags.scope_id IS 'ID of the project or org for scoped flags, or "global" for global flags';
      `)

      console.log('[Migration] Successfully added scope_id support to feature_flags table')
    } else {
      console.log('[Migration] scope_id column already exists, skipping migration')
    }

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error adding scope_id to feature_flags table:', error)
    return { success: false, error }
  }
}

/**
 * Rollback the migration
 */
export async function down() {
  const pool = getPool()

  try {
    // Step 1: Drop the new primary key
    await pool.query(`
      ALTER TABLE control_plane.feature_flags
      DROP CONSTRAINT feature_flags_pkey;
    `)
    console.log('[Migration Rollback] Dropped composite primary key')

    // Step 2: Drop the scope check constraint
    await pool.query(`
      ALTER TABLE control_plane.feature_flags
      DROP CONSTRAINT IF EXISTS feature_flags_scope_check;
    `)
    console.log('[Migration Rollback] Dropped scope check constraint')

    // Step 3: Drop scope_id index
    await pool.query(`
      DROP INDEX IF EXISTS control_plane.idx_feature_flags_scope_id;
    `)
    console.log('[Migration Rollback] Dropped scope_id index')

    // Step 4: Delete non-global flags (we can't safely convert them)
    await pool.query(`
      DELETE FROM control_plane.feature_flags
      WHERE scope != 'global';
    `)
    console.log('[Migration Rollback] Deleted non-global flags')

    // Step 5: Drop scope_id column
    await pool.query(`
      ALTER TABLE control_plane.feature_flags
      DROP COLUMN IF EXISTS scope_id;
    `)
    console.log('[Migration Rollback] Dropped scope_id column')

    // Step 6: Restore old primary key
    await pool.query(`
      ALTER TABLE control_plane.feature_flags
      ADD PRIMARY KEY (name);
    `)
    console.log('[Migration Rollback] Restored old primary key')

    // Step 7: Restore old CHECK constraint
    await pool.query(`
      ALTER TABLE control_plane.feature_flags
      ADD CONSTRAINT feature_flags_scope_check
      CHECK (scope IN ('global', 'project', 'org'));
    `)
    console.log('[Migration Rollback] Restored old scope check constraint')

    console.log('[Migration Rollback] Successfully rolled back scope_id support')
    return { success: true }
  } catch (error) {
    console.error('[Migration Rollback] Error rolling back scope_id:', error)
    return { success: false, error }
  }
}

// Run migration if called directly
if (require.main === module) {
  up().then(result => {
    if (result.success) {
      console.log('[Migration] Completed successfully')
      process.exit(0)
    } else {
      console.error('[Migration] Failed:', result.error)
      process.exit(1)
    }
  })
}
