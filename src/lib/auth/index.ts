/**
 * Authentication Library
 *
 * JWT-based authentication for NextMavens platform.
 * US-001: Require project_id in JWT
 */

// Types
export type { Developer, JwtPayload, AuthenticatedEntity } from './types'

// Token operations
export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from './tokens'

// API keys
export { generateApiKey, hashApiKey } from './api-keys'

// Utilities
export { generateSlug, authenticateRequest, createDeveloperSession } from './utils'

// Status checking
export { checkProjectStatus } from './status'

// Database operations
export {
  getDeveloperByEmail,
  getDeveloperById,
  validateDeveloperForProject,
} from './database'
