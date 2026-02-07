/**
 * Run Organizations Migration
 *
 * This script creates the organizations and organization_members tables
 * in the control_plane schema.
 */

import { createOrganizationsTables } from '../src/features/organizations'

async function main() {
  console.log('🔄 Running organizations migration...')

  try {
    const result = await createOrganizationsTables()

    if (result.success) {
      console.log('✅ Organizations migration completed successfully!')
      process.exit(0)
    } else {
      console.error('❌ Organizations migration failed:', result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

main()
