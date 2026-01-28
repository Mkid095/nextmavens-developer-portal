/**
 * Run the manual overrides migrations
 *
 * This script creates all tables needed for the manual override system:
 * - manual_overrides: Tracks manual override operations performed by administrators
 */

import { createManualOverridesTable, ensureDevelopersRoleColumn } from '../src/features/abuse-controls/migrations/create-manual-overrides-table'

async function main() {
  console.log('=================================')
  console.log('Running Manual Overrides Migrations')
  console.log('=================================\n')

  // Ensure developers table has role column
  console.log('1. Ensuring developers.role column exists...')
  const developersRoleResult = await ensureDevelopersRoleColumn()
  if (developersRoleResult.success) {
    console.log('✓ developers.role column check completed\n')
  } else {
    console.error('✗ developers.role column check failed:', developersRoleResult.error)
    process.exit(1)
  }

  // Create manual_overrides table
  console.log('2. Creating manual_overrides table...')
  const manualOverridesResult = await createManualOverridesTable()
  if (manualOverridesResult.success) {
    console.log('✓ manual_overrides table migration completed\n')
  } else {
    console.error('✗ manual_overrides table migration failed:', manualOverridesResult.error)
    process.exit(1)
  }

  console.log('=================================')
  console.log('All migrations completed successfully!')
  console.log('=================================')
  process.exit(0)
}

main().catch(error => {
  console.error('Migration error:', error)
  process.exit(1)
})
