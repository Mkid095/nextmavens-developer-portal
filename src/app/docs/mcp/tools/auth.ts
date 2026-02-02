/**
 * MCP Tools - Authentication
 */

import type { ToolCategory } from '../types'
import { Shield } from 'lucide-react'

export const authTools: ToolCategory = {
  category: 'Authentication',
  icon: Shield,
  tools: [
    {
      name: 'nextmavens_signin',
      description: 'Sign in a user with email and password',
      inputSchema: {
        email: { type: 'string', required: true },
        password: { type: 'string', required: true }
      },
      scopes: ['auth:manage'],
    },
    {
      name: 'nextmavens_signup',
      description: 'Sign up a new user',
      inputSchema: {
        email: { type: 'string', required: true },
        password: { type: 'string', required: true },
        name: { type: 'string', description: 'User display name' },
        tenantId: { type: 'string', description: 'Tenant ID for multi-tenancy' }
      },
      scopes: ['auth:manage'],
    },
  ],
}
