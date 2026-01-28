/**
 * Run the rate_limits migration
 */

import { createRateLimitsTable } from '../src/features/abuse-controls/migrations/create-rate-limits-table'

async function main() {
  console.log('Running rate_limits migration...')
  const result = await createRateLimitsTable()

  if (result.success) {
    console.log('Migration completed successfully')
    process.exit(0)
  } else {
    console.error('Migration failed:', result.error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Migration error:', error)
  process.exit(1)
})
