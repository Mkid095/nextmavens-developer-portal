/**
 * GET /api/admin/abuse/dashboard
 * @deprecated Re-exports from dashboard module for backward compatibility
 * Import from './dashboard' instead
 *
 * Get abuse dashboard summary statistics
 */

export { GET } from './dashboard/handlers'
export type { DashboardStatsResponse } from './dashboard/types'
