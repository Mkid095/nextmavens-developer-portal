/**
 * Authentication Library
 *
 * JWT-based authentication for NextMavens platform.
 * US-001: Require project_id in JWT
 */

// Import and re-export to help TypeScript isolated modules
import type { Developer, JwtPayload, AuthenticatedEntity } from './types'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from './tokens'
import { generateApiKey, hashApiKey } from './api-keys'
import { generateSlug, createDeveloperSession } from './utils'
import { authenticateRequest } from './request'
import { checkProjectStatus } from './status'
import {
  getDeveloperByEmail,
  getDeveloperById,
  validateDeveloperForProject,
} from './database'

// Types
export type { Developer, JwtPayload, AuthenticatedEntity }

// Token operations
export { generateAccessToken, generateRefreshToken, verifyAccessToken }

// API keys
export { generateApiKey, hashApiKey }

// Utilities
export { generateSlug, authenticateRequest, createDeveloperSession }

// Status checking
export { checkProjectStatus }

// Database operations
export { getDeveloperByEmail, getDeveloperById, validateDeveloperForProject }
