/**
 * Usage API Utilities
 */

import type { Service, Aggregation } from './types'
import { VALID_SERVICES, VALID_AGGREGATIONS, DEFAULT_DAYS } from './constants'
import type { UsageRequestParams, ParsedQueryParams } from './types'

/**
 * Parse and validate query parameters
 */
export function parseQueryParams(params: UsageRequestParams): ParsedQueryParams {
  const now = new Date()
  let startDate: Date
  let endDate: Date = now
  let aggregation: Aggregation = 'day'
  const filters: { service?: string; metric_type?: string } = {}

  // Parse aggregation period
  if (params.aggregation && VALID_AGGREGATIONS.includes(params.aggregation as Aggregation)) {
    aggregation = params.aggregation as Aggregation
  }

  // Parse date range
  if (params.start_date) {
    startDate = new Date(params.start_date)
  } else if (params.days) {
    const days = parseInt(params.days) || DEFAULT_DAYS
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  } else {
    startDate = new Date(now.getTime() - DEFAULT_DAYS * 24 * 60 * 60 * 1000) // Default 30 days
  }

  if (params.end_date) {
    endDate = new Date(params.end_date)
  }

  // Parse filters
  if (params.service && VALID_SERVICES.includes(params.service as Service)) {
    filters.service = params.service
  }

  if (params.metric_type) {
    filters.metric_type = params.metric_type
  }

  return { startDate, endDate, aggregation, filters }
}

/**
 * Get date truncation SQL for aggregation period
 */
export function getDateTrunc(aggregation: Aggregation): string {
  switch (aggregation) {
    case 'day':
      return 'DATE(recorded_at)'
    case 'week':
      return 'DATE_TRUNC(\'week\', recorded_at)'
    case 'month':
      return 'DATE_TRUNC(\'month\', recorded_at)'
    default:
      return 'DATE(recorded_at)'
  }
}

/**
 * Build WHERE clause conditions for usage queries
 */
export function buildWhereClause(
  filters: { service?: string; metric_type?: string }
): { conditions: string[]; params: any[]; nextIndex: number } {
  const conditions: string[] = []
  const params: any[] = []

  if (filters.service) {
    conditions.push(`service = $1`)
    params.push(filters.service)
  }

  if (filters.metric_type) {
    const index = filters.service ? 2 : 1
    conditions.push(`metric_type = $${index}`)
    params.push(filters.metric_type)
  }

  return {
    conditions,
    params,
    nextIndex: params.length + 1,
  }
}
