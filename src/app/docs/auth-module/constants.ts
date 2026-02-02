/**
 * Authentication Documentation - Module - Constants
 */

import type { AuthConfig, Endpoint, JwtStructure, SecurityPractice } from './types'

export const AUTH_CONFIG: AuthConfig = {
  domain: 'https://auth.nextmavens.cloud',
  port: 4000,
  jwtSecret: 'nextmavens-auth-secret-key-2024-production-secure',
  accessTokenExpiry: '1 hour',
  refreshTokenExpiry: '7 days',
}

export const ENDPOINTS: Endpoint[] = [
  {
    name: 'Login',
    method: 'POST',
    path: '/api/auth/login',
    gatewayPath: '/api/auth/login',
    description: 'Authenticate user with email and password',
    request: {
      email: 'string',
      password: 'string',
    },
    response: {
      user: 'User object with id, email, name, role, tenant_id',
      accessToken: 'JWT token (expires in 1 hour)',
      refreshToken: 'JWT token (expires in 7 days)',
    },
  },
  {
    name: 'Signup',
    method: 'POST',
    path: '/api/auth/signup',
    gatewayPath: '/api/auth/signup',
    description: 'Register a new user account',
    request: {
      email: 'string',
      password: 'string (min 8 characters)',
      name: 'string',
    },
    response: {
      user: 'Created user object',
      accessToken: 'JWT token',
      refreshToken: 'JWT token',
    },
  },
  {
    name: 'Refresh Token',
    method: 'POST',
    path: '/api/auth/refresh',
    gatewayPath: '/api/auth/refresh',
    description: 'Get a new access token using refresh token',
    request: {
      refreshToken: 'string',
    },
    response: {
      accessToken: 'New JWT token',
    },
  },
  {
    name: 'Logout',
    method: 'POST',
    path: '/api/auth/logout',
    gatewayPath: '/api/auth/logout',
    description: 'Invalidate current session',
    request: {
      refreshToken: 'string',
    },
    response: {
      success: 'boolean',
    },
  },
  {
    name: 'Get Current User',
    method: 'GET',
    path: '/api/auth/me',
    gatewayPath: '/api/auth/me',
    description: 'Get currently authenticated user',
    headers: {
      Authorization: 'Bearer <token>',
    },
    response: {
      user: 'User object',
    },
  },
]

export const JWT_STRUCTURE: JwtStructure = {
  header: 'alg: HS256, typ: JWT',
  payload: {
    userId: 'integer',
    email: 'string',
    tenantId: 'uuid (optional)',
    role: 'string (user|owner|admin)',
    iat: 'issued at timestamp',
    exp: 'expiration timestamp',
  },
}

export const SECURITY_PRACTICES: SecurityPractice[] = [
  {
    title: 'Store Tokens Securely',
    description: "Never store tokens in localStorage. Use httpOnly cookies or secure storage.",
  },
  {
    title: 'Handle Token Expiry',
    description: 'Refresh tokens before expiry. Implement automatic token refresh.',
  },
  {
    title: 'Use HTTPS Only',
    description: 'Never send tokens over unencrypted connections.',
  },
  {
    title: 'Validate Tokens',
    description: 'Always validate token signature and expiration on the server.',
  },
]
