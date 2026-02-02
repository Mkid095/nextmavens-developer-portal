/**
 * MCP Tools - API Key Management
 */

import type { ToolCategory } from '../types'
import { Key } from 'lucide-react'

export const apiKeyTools: ToolCategory = {
  category: 'API Key Management',
  icon: Key,
  tools: [
    {
      name: 'nextmavens_create_api_key',
      description: 'Create an API key with expiration options',
      inputSchema: {
        name: { type: 'string', required: true },
        scopes: { type: 'array', description: 'Array of scope strings' },
        expiration: {
          type: 'string',
          enum: ['1day', '1week', '2weeks', '3weeks', '30days', '1year', 'forever']
        }
      },
      scopes: ['key:create'],
    },
    {
      name: 'nextmavens_list_api_keys',
      description: 'List all API keys',
      inputSchema: {},
      scopes: ['key:read'],
    },
    {
      name: 'nextmavens_get_api_key',
      description: 'Get API key details',
      inputSchema: {
        keyId: { type: 'string', required: true }
      },
      scopes: ['key:read'],
    },
    {
      name: 'nextmavens_delete_api_key',
      description: 'Delete an API key',
      inputSchema: {
        keyId: { type: 'string', required: true }
      },
      scopes: ['key:delete'],
    },
  ],
}
