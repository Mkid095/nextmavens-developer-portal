/**
 * POST /internal/migrate/organizations
 *
 * Internal endpoint to create organizations and organization_members tables.
 *
 * This is an internal endpoint for database migrations.
 * In production, migrations should be run as part of deployment process.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createOrganizationsTables } from '@/features/organizations'

export async function POST(req: NextRequest) {
  try {
    const result = await createOrganizationsTables()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Organizations migration completed successfully',
      })
    } else {
      const errorMsg = result.error instanceof Error ? result.error.message : 'Migration failed'
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
        },
        { status: 500 }
      )
    }
  } catch (error: unknown) {
    console.error('[Organizations Migration] Error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    )
  }
}
