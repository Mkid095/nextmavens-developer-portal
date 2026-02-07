/**
 * Seed Core Feature Flags
 *
 * This migration seeds the core feature flags that control
 * critical platform functions during incidents.
 *
 * US-003: Implement Core Feature Flags
 */

import { getPool } from '@/lib/db'

/**
 * Seed core feature flags into the database
 */
export async function seedCoreFeatureFlags() {
  const pool = getPool()

  try {
    // Seed signups_enabled flag (global, default: true)
    await pool.query(`
      INSERT INTO control_plane.feature_flags (name, enabled, scope, metadata)
      VALUES ('signups_enabled', true, 'global', '{"description": "Enable new user signups", "category": "auth"}')
      ON CONFLICT (name) DO NOTHING
    `)
    console.log('[Migration] Seeded signups_enabled flag')

    // Seed provisioning_enabled flag (global, default: true)
    await pool.query(`
      INSERT INTO control_plane.feature_flags (name, enabled, scope, metadata)
      VALUES ('provisioning_enabled', true, 'global', '{"description": "Enable project provisioning", "category": "infrastructure"}')
      ON CONFLICT (name) DO NOTHING
    `)
    console.log('[Migration] Seeded provisioning_enabled flag')

    // Seed storage_enabled flag (global, default: true)
    await pool.query(`
      INSERT INTO control_plane.feature_flags (name, enabled, scope, metadata)
      VALUES ('storage_enabled', true, 'global', '{"description": "Enable file storage operations", "category": "storage"}')
      ON CONFLICT (name) DO NOTHING
    `)
    console.log('[Migration] Seeded storage_enabled flag')

    // Seed realtime_enabled flag (global, default: true)
    await pool.query(`
      INSERT INTO control_plane.feature_flags (name, enabled, scope, metadata)
      VALUES ('realtime_enabled', true, 'global', '{"description": "Enable realtime WebSocket connections", "category": "realtime"}')
      ON CONFLICT (name) DO NOTHING
    `)
    console.log('[Migration] Seeded realtime_enabled flag')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error seeding core feature flags:', error)
    return { success: false, error }
  }
}

/**
 * Rollback: Remove core feature flags
 *
 * WARNING: This will remove the core feature flags from the database.
 */
export async function removeCoreFeatureFlags() {
  const pool = getPool()

  try {
    await pool.query(`
      DELETE FROM control_plane.feature_flags
      WHERE name IN ('signups_enabled', 'provisioning_enabled', 'storage_enabled', 'realtime_enabled')
    `)
    console.log('[Migration] Removed core feature flags')

    return { success: true }
  } catch (error) {
    console.error('[Migration] Error removing core feature flags:', error)
    return { success: false, error }
  }
}
