/**
 * Incident Route Module - PUT Handler
 */

import type { NextRequest } from 'next/server'
import { getPool } from '@/lib/db'
import { ERROR_MESSAGES, ERROR_CODES, HTTP_STATUS, LOG_PREFIXES } from '../constants'
import { authenticateAndGetDeveloper, requireOperatorOrAdmin } from '../auth'
import {
  validateUpdateBody,
  hasUpdateFields,
} from '../validators'
import {
  handleUnknownError,
  successResponse,
  errorResponse,
  notFoundResponse,
} from '../response-builders'
import type { UpdateIncidentBody } from '../types'

/**
 * Build update query dynamically based on provided fields
 */
interface UpdateQuery {
  fields: string[]
  values: unknown[]
  paramIndex: number
}

function buildUpdateQuery(body: UpdateIncidentBody): UpdateQuery {
  const updateFields: string[] = []
  const updateValues: unknown[] = []
  let paramIndex = 1

  if (body.status !== undefined) {
    updateFields.push(`status = $${paramIndex++}`)
    updateValues.push(body.status)

    // If status is resolved and resolved_at not provided, set it to now
    if (body.status === 'resolved' && !body.resolved_at) {
      updateFields.push(`resolved_at = NOW()`)
    } else if (body.status === 'active') {
      updateFields.push(`resolved_at = NULL`)
    }
  }

  if (body.title !== undefined) {
    updateFields.push(`title = $${paramIndex++}`)
    updateValues.push(body.title)
  }

  if (body.description !== undefined) {
    updateFields.push(`description = $${paramIndex++}`)
    updateValues.push(body.description)
  }

  if (body.impact !== undefined) {
    updateFields.push(`impact = $${paramIndex++}`)
    updateValues.push(body.impact)
  }

  if (body.resolved_at !== undefined) {
    updateFields.push(`resolved_at = $${paramIndex++}`)
    updateValues.push(body.resolved_at)
  }

  return { fields: updateFields, values: updateValues, paramIndex }
}

/**
 * PUT /api/admin/incidents/[id]
 * Update incident details
 */
export async function updateIncidentHandler(
  req: NextRequest,
  incidentId: string
): Promise<ReturnType<typeof successResponse> | ReturnType<typeof errorResponse>> {
  try {
    // Authenticate the request
    const developer = await authenticateAndGetDeveloper(req)

    // Authorize - only operators and admins can update incidents
    await requireOperatorOrAdmin(developer)

    const body = (await req.json()) as UpdateIncidentBody

    // Validate request body
    const validation = validateUpdateBody(body)
    if (!validation.isValid && validation.response) {
      return validation.response
    }

    // Check if there are fields to update
    if (!hasUpdateFields(body)) {
      return errorResponse(
        ERROR_MESSAGES.NO_FIELDS,
        ERROR_CODES.NO_FIELDS,
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Build update query
    const { fields, values, paramIndex } = buildUpdateQuery(body)
    values.push(incidentId)

    const pool = getPool()
    const result = await pool.query(
      `UPDATE control_plane.incidents
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, service, status, title, description, impact, started_at, resolved_at, affected_services, created_at`,
      values
    )

    if (result.rows.length === 0) {
      return notFoundResponse()
    }

    return successResponse({
      message: 'Incident updated',
      incident: result.rows[0],
    })
  } catch (error: unknown) {
    return handleUnknownError(error, LOG_PREFIXES.UPDATE_ERROR)
  }
}
