import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const pool = getPool()

    // Check if name column exists in api_keys
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'api_keys'
      AND column_name = 'name'
    `)

    let message = ''

    if (checkResult.rows.length === 0) {
      // Add name column
      await pool.query(`ALTER TABLE api_keys ADD COLUMN name VARCHAR(255)`)
      message = 'Added name column to api_keys table'

      // Update existing keys to have default names
      await pool.query(`
        UPDATE api_keys
        SET name = key_type || ' key'
        WHERE name IS NULL
      `)
    } else {
      message = 'Name column already exists'
    }

    return NextResponse.json({ success: true, message })
  } catch (error: any) {
    console.error('[Migration] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
}
