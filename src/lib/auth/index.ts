/**
 * Authentication Library
 *
 * JWT-based authentication for NextMavens platform.
 * US-001: Require project_id in JWT
 */

// Types
export type { Developer, JwtPayload, AuthenticatedEntity } from './auth/types'

// Token operations
export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from './auth/tokens'

// API keys
export { generateApiKey, hashApiKey } from './auth/api-keys'

// Utilities
export { generateSlug, authenticateRequest, createDeveloperSession } from './auth/utils'

// Status checking
export { checkProjectStatus } from './auth/status'

// Database operations
export {
  getDeveloperByEmail,
  getDeveloperById,
  validateDeveloperForProject,
} from './auth/database'
