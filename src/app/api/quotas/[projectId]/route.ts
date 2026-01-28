import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware'
import {
  getProjectQuotas,
  setProjectQuota,
  resetProjectQuotas,
  deleteProjectQuota,
  getProjectQuotaStats,
} from '@/features/abuse-controls/lib/quotas'
import { HardCapType } from '@/features/abuse-controls/types'
import { validateCapValue, getCapValidationError } from '@/features/abuse-controls/lib/config'

/**
 * GET /api/quotas/:projectId
 * Get all quotas for a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const { projectId } = params

    // Verify developer owns this project
    const pool = require('@/lib/db').getPool()
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const stats = await getProjectQuotaStats(projectId)
    const quotas = await getProjectQuotas(projectId)

    return NextResponse.json({
      project_id: projectId,
      configured: stats.configured,
      quotas: stats.quotas,
      raw_quotas: quotas,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Quotas API] Get quotas error:', error)
    return NextResponse.json(
      { error: err.message || 'Failed to get quotas' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * PUT /api/quotas/:projectId
 * Update a specific quota for a project
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const { projectId } = params
    const body = await req.json()
    const { cap_type, cap_value } = body

    // Validation
    if (!cap_type || !cap_value) {
      return NextResponse.json(
        { error: 'cap_type and cap_value are required' },
        { status: 400 }
      )
    }

    // Validate cap type
    if (!Object.values(HardCapType).includes(cap_type)) {
      return NextResponse.json(
        { error: `Invalid cap_type. Must be one of: ${Object.values(HardCapType).join(', ')}` },
        { status: 400 }
      )
    }

    // Validate cap value
    if (!validateCapValue(cap_type as HardCapType, cap_value)) {
      const validationError = getCapValidationError(cap_type as HardCapType, cap_value)
      return NextResponse.json(
        { error: validationError || 'Invalid cap value' },
        { status: 400 }
      )
    }

    // Verify developer owns this project
    const pool = require('@/lib/db').getPool()
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Update quota
    const quota = await setProjectQuota(projectId, cap_type as HardCapType, cap_value)

    return NextResponse.json({
      quota,
      message: 'Quota updated successfully',
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Quotas API] Update quota error:', error)
    return NextResponse.json(
      { error: err.message || 'Failed to update quota' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}

/**
 * DELETE /api/quotas/:projectId
 * Reset all quotas for a project to defaults
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const developer = await authenticateRequest(req)
    const { projectId } = params
    const { searchParams } = new URL(req.url)
    const capType = searchParams.get('cap_type')

    // Verify developer owns this project
    const pool = require('@/lib/db').getPool()
    const projectCheck = await pool.query(
      'SELECT id FROM projects WHERE id = $1 AND developer_id = $2',
      [projectId, developer.id]
    )

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    if (capType) {
      // Delete specific quota
      if (!Object.values(HardCapType).includes(capType as HardCapType)) {
        return NextResponse.json(
          { error: `Invalid cap_type. Must be one of: ${Object.values(HardCapType).join(', ')}` },
          { status: 400 }
        )
      }

      await deleteProjectQuota(projectId, capType as HardCapType)
      return NextResponse.json({
        message: `Quota ${capType} deleted. Will use default value.`,
      })
    } else {
      // Reset all quotas to defaults
      const quotas = await resetProjectQuotas(projectId)
      return NextResponse.json({
        quotas,
        message: 'All quotas reset to defaults',
      })
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[Quotas API] Delete quota error:', error)
    return NextResponse.json(
      { error: err.message || 'Failed to delete quota' },
      { status: err.message === 'No token provided' ? 401 : 500 }
    )
  }
}
