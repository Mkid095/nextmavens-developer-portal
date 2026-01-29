import { addDeletionColumnsToProjects } from '@/features/deletion-preview'

/**
 * Migration script for Deletion with Preview feature
 *
 * This script adds deletion columns to the projects table to support
 * soft delete functionality with a 30-day grace period.
 *
 * Run with: pnpm run migrate:deletion-preview
 */
async function runMigration() {
  console.log('[Migration] Starting Deletion Preview migration...')
  console.log('[Migration] Adding deletion columns to projects table')

  const result = await addDeletionColumnsToProjects()

  if (result.success) {
    console.log('[Migration] ✅ Deletion Preview migration completed successfully')
    process.exit(0)
  } else {
    console.error('[Migration] ❌ Deletion Preview migration failed:', result.error)
    process.exit(1)
  }
}

runMigration().catch((error) => {
  console.error('[Migration] Fatal error during migration:', error)
  process.exit(1)
})
