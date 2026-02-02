/**
 * Audit Logger Module - Request Utilities
 */

/**
 * Extract IP address from request headers
 *
 * @param req - The Request object
 * @returns The client IP address
 */
export function extractClientIP(req: Request): string {
  // Try x-forwarded-for header first (for proxied requests)
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, use the first one
    return forwardedFor.split(',')[0].trim()
  }

  // Try cf-connecting-ip header (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }

  // Try x-real-ip header (Nginx)
  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to a default
  return '0.0.0.0'
}

/**
 * Extract user agent from request headers
 *
 * @param req - The Request object
 * @returns The user agent string
 */
export function extractUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'Unknown'
}
