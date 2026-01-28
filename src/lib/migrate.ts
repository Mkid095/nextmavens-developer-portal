import { getPool } from './db'

export async function ensureApiKeyNameColumn() {
  const pool = getPool()
  try {
    // Check if name column exists
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'api_keys'
      AND column_name = 'name'
    `)

    if (checkResult.rows.length === 0) {
      // Add name column if it doesn't exist
      await pool.query(`
        ALTER TABLE api_keys
        ADD COLUMN name VARCHAR(255)
      `)
      console.log('[Migration] Added name column to api_keys table')
    }
  } catch (error) {
    console.error('[Migration] Error ensuring api_keys.name column:', error)
  }
}
