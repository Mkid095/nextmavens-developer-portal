/**
 * Admin Authentication
 *
 * Simple admin token verification for administrative endpoints.
 * In production, this should use proper authentication with role-based access control.
 */

/**
 * Verify if the request is from an admin user
 * Checks for admin token in Authorization header
 *
 * @param authHeader - Authorization header value
 * @returns True if admin, false otherwise
 */
export async function verifyAdminToken(
  authHeader: string | null
): Promise<boolean> {
  // Get admin token from environment
  const adminToken = process.env.ADMIN_API_TOKEN

  if (!adminToken) {
    // If no admin token is configured, deny access
    console.warn('[AdminAuth] ADMIN_API_TOKEN not configured')
    return false
  }

  if (!authHeader) {
    return false
  }

  // Extract token from Bearer header
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return false
  }

  const token = parts[1]

  // Verify token matches
  return token === adminToken
}
