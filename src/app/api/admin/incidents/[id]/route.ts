/**
 * PUT /api/admin/incidents/[id]
 * GET /api/admin/incidents/[id]
 *
 * Update and get incident details (admin only)
 *
 * Allows operators and admins to update incident status and details.
 * Requires admin or operator role.
 *
 * US-008: Update Incident Status
 *
 * @deprecated This route has been refactored into a module.
 * The handlers are now organized in './incident-route-module' for better maintainability.
 */

import type { NextRequest } from 'next/server'
import { getIncidentHandler } from './incident-route-module/handlers/get-handler'
import { updateIncidentHandler } from './incident-route-module/handlers/put-handler'

/**
 * GET /api/admin/incidents/[id]
 * Fetch incident details with updates
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return getIncidentHandler(req, params.id)
}

/**
 * PUT /api/admin/incidents/[id]
 * Update incident details
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateIncidentHandler(req, params.id)
}
