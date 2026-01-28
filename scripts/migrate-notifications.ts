/**
 * Run the notifications migration
 */

import { createNotificationsTable } from '../src/features/abuse-controls/migrations/create-notifications-table'

async function main() {
  console.log('Running notifications migration...')
  const result = await createNotificationsTable()

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
