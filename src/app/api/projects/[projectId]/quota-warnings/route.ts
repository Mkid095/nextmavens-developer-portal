import { NextRequest, NextResponse } from 'next/server'
import { getProjectQuotaWarnings } from '@/features/abuse-controls/lib/quota-warnings'

/**
 * GET /api/projects/[projectId]/quota-warnings
 *
 * Get quota warnings for a specific project.
 * Returns warnings for services that are at or above 80% of their quota.
 *
 * US-005: Implement Quota Warnings - Warning shown in dashboard
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const warnings = await getProjectQuotaWarnings(projectId)

    if (!warnings) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: warnings,
    })
  } catch (error) {
    console.error('[API] Error getting quota warnings:', error)
    return NextResponse.json(
      {
        error: 'Failed to get quota warnings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
