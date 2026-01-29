import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { addKeyTypeAndScopesToApiKeys } from '@/features/enhanced-api-keys'
import { createFeatureFlagsTable } from '@/features/feature-flags'
import { seedCoreFeatureFlags } from '@/features/feature-flags'

export async function POST(req: NextRequest) {
  try {
    const pool = getPool()

    const results = []

    // Run feature flags table migration
    const featureFlagsTableResult = await createFeatureFlagsTable()
    results.push({
      migration: 'feature-flags-table',
      success: featureFlagsTableResult.success,
      error: featureFlagsTableResult.error
    })

    // Run core feature flags seed migration
    const coreFeatureFlagsResult = await seedCoreFeatureFlags()
    results.push({
      migration: 'core-feature-flags',
      success: coreFeatureFlagsResult.success,
      error: coreFeatureFlagsResult.error
    })

    // Run enhanced API keys migration
    const enhancedApiKeysResult = await addKeyTypeAndScopesToApiKeys()
    results.push({
      migration: 'enhanced-api-keys',
      success: enhancedApiKeysResult.success,
      error: enhancedApiKeysResult.error
    })

    // Check if name column exists in api_keys (legacy migration)
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'api_keys'
      AND column_name = 'name'
    `)

    if (checkResult.rows.length === 0) {
      // Add name column
      await pool.query(`ALTER TABLE api_keys ADD COLUMN name VARCHAR(255)`)

      // Update existing keys to have default names
      await pool.query(`
        UPDATE api_keys
        SET name = COALESCE(key_type::text, 'public') || ' key'
        WHERE name IS NULL
      `)
      results.push({
        migration: 'api-keys-name',
        success: true,
        message: 'Added name column to api_keys table'
      })
    } else {
      results.push({
        migration: 'api-keys-name',
        success: true,
        message: 'Name column already exists'
      })
    }

    const allSuccessful = results.every(r => r.success)

    return NextResponse.json({
      success: allSuccessful,
      results
    })
  } catch (error: any) {
    console.error('[Migration] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
}
