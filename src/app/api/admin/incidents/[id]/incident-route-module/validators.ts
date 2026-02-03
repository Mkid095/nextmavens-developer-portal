/**
 * Incident Route Module - Validators
 */

import { NextResponse } from 'next/server'
import { VALID_STATUSES, VALID_IMPACTS, ERROR_MESSAGES, ERROR_CODES, HTTP_STATUS } from './constants'
import type { UpdateIncidentBody } from './types'

/**
 * Validation error response
 */
export interface ValidationError {
  isValid: boolean
  response?: ReturnType<typeof NextResponse.json>
}

/**
 * Validate status value
 */
export function validateStatus(status: unknown): ValidationError {
  if (status && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.INVALID_STATUS(VALID_STATUSES as string[]),
          code: ERROR_CODES.INVALID_STATUS,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      ),
    }
  }
  return { isValid: true }
}

/**
 * Validate impact value
 */
export function validateImpact(impact: unknown): ValidationError {
  if (impact && !VALID_IMPACTS.includes(impact as typeof VALID_IMPACTS[number])) {
    return {
      isValid: false,
      response: NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.INVALID_IMPACT(VALID_IMPACTS as string[]),
          code: ERROR_CODES.INVALID_IMPACT,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      ),
    }
  }
  return { isValid: true }
}

/**
 * Validate update request body
 */
export function validateUpdateBody(body: UpdateIncidentBody): ValidationError {
  const statusValidation = validateStatus(body.status)
  if (!statusValidation.isValid) {
    return statusValidation
  }

  const impactValidation = validateImpact(body.impact)
  if (!impactValidation.isValid) {
    return impactValidation
  }

  return { isValid: true }
}

/**
 * Check if there are any fields to update
 */
export function hasUpdateFields(body: UpdateIncidentBody): boolean {
  return (
    body.status !== undefined ||
    body.title !== undefined ||
    body.description !== undefined ||
    body.impact !== undefined ||
    body.resolved_at !== undefined
  )
}
