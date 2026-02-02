/**
 * Audit Logger - Request Extraction Functions
 *
 * US-008: Request ID captured from x-request-id header
 */

import type { NextRequest } from 'next/server'
import { extractCorrelationId, generateCorrelationId } from '@/lib/middleware/correlation'

/**
 * Extract correlation ID from request for audit logging
 *
 * US-008: Request ID captured from x-request-id header
 *
 * @param req - NextRequest object
 * @returns The correlation ID or null
 */
export function extractRequestId(req: NextRequest): string | null {
  return extractCorrelationId(req)
}

/**
 * Generate a new correlation ID for audit logging
 *
 * @returns A new UUID string
 */
export function generateRequestId(): string {
  return generateCorrelationId()
}

/**
 * Extract IP address from request
 *
 * @param req - NextRequest object
 * @returns The client IP address
 */
export function extractIpAddress(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return '0.0.0.0'
}

/**
 * Extract user agent from request
 *
 * @param req - NextRequest object
 * @returns The user agent string
 */
export function extractUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'Unknown'
}
