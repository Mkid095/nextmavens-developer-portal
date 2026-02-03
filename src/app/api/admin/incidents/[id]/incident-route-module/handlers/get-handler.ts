/**
 * Incident Route Module - GET Handler
 */

import type { NextRequest } from 'next/server'
import { getPool } from '@/lib/db'
import { SQL_QUERIES, ERROR_MESSAGES, LOG_PREFIXES } from '../constants'
import { authenticateAndGetDeveloper, requireOperatorOrAdmin } from '../auth'
import {
  handleUnknownError,
  successResponse,
  notFoundResponse,
} from '../response-builders'
import type { IncidentWithUpdates } from '../types'

/**
 * GET /api/admin/incidents/[id]
 * Fetch incident details with updates
 */
export async function getIncidentHandler(
  req: NextRequest,
  incidentId: string
): Promise<ReturnType<typeof successResponse> | ReturnType<typeof notFoundResponse>> {
  try {
    // Authenticate the request
    const developer = await authenticateAndGetDeveloper(req)

    // Authorize - only operators and admins can view incidents
    await requireOperatorOrAdmin(developer)

    const pool = getPool()

    // Get incident with updates
    const incidentResult = await pool.query(SQL_QUERIES.GET_INCIDENT, [incidentId])

    if (incidentResult.rows.length === 0) {
      return notFoundResponse()
    }

    const incident = incidentResult.rows[0]

    // Get incident updates
    const updatesResult = await pool.query(SQL_QUERIES.GET_INCIDENT_UPDATES, [incidentId])

    return successResponse({
      incident: {
        ...incident,
        updates: updatesResult.rows,
      } as IncidentWithUpdates,
    })
  } catch (error: unknown) {
    return handleUnknownError(error, LOG_PREFIXES.GET_ERROR)
  }
}
