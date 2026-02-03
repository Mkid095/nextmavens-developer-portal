/**
 * Abuse Dashboard Queries Module - Utilities
 */

import type {
  SuspensionsResultRow,
  RateLimitsResultRow,
  PatternTypeRow,
  PatternSeverityRow,
} from './types'

/**
 * Reduces suspension rows to a by_type object
 */
export function reduceSuspensionsByType(
  rows: SuspensionsResultRow[]
): Record<string, number> {
  return rows.reduce(
    (acc: Record<string, number>, row: SuspensionsResultRow) => {
      acc[row.cap_exceeded] = parseInt(row.count)
      return acc
    },
    {}
  )
}

/**
 * Reduces rate limit rows to a by_type object
 */
export function reduceRateLimitsByType(
  rows: RateLimitsResultRow[]
): Record<string, number> {
  return rows.reduce(
    (acc: Record<string, number>, row: RateLimitsResultRow) => {
      acc[row.identifier_type] = parseInt(row.count)
      return acc
    },
    {}
  )
}

/**
 * Reduces pattern type rows to a by_type object
 */
export function reducePatternTypesByType(
  rows: PatternTypeRow[]
): Record<string, number> {
  return rows.reduce(
    (acc: Record<string, number>, row: PatternTypeRow) => {
      acc[row.pattern_type] = parseInt(row.count)
      return acc
    },
    {}
  )
}

/**
 * Reduces pattern severity rows to a by_severity object
 */
export function reducePatternsBySeverity(
  rows: PatternSeverityRow[]
): Record<string, number> {
  return rows.reduce(
    (acc: Record<string, number>, row: PatternSeverityRow) => {
      acc[row.severity] = parseInt(row.count)
      return acc
    },
    {}
  )
}

/**
 * Wraps a query function with error handling
 */
export async function withErrorHandling<T>(
  queryFn: () => Promise<T>,
  errorMessage: string,
  defaultValue: T
): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    console.error(errorMessage, error)
    return defaultValue
  }
}

/**
 * Safely parses an integer from a string
 */
export function safeParseInt(value: string): number {
  const parsed = parseInt(value)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Safely parses a float from a string
 */
export function safeParseFloat(value: string): number {
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}
