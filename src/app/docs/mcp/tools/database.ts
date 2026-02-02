/**
 * MCP Tools - Database Operations
 */

import type { ToolCategory } from '../types'
import { Database } from 'lucide-react'

export const databaseTools: ToolCategory = {
  category: 'Database Operations',
  icon: Database,
  tools: [
    {
      name: 'nextmavens_query',
      description: 'Execute a database query on NextMavens. Supports SELECT operations with filters, pagination, and ordering.',
      inputSchema: {
        table: { type: 'string', required: true, description: 'Table name to query' },
        filters: {
          type: 'array',
          description: 'Array of filters: [{column, operator, value}]',
          operators: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in']
        },
        limit: { type: 'number', description: 'Maximum number of results' },
        offset: { type: 'number', description: 'Number of results to skip' },
        orderBy: { type: 'object', description: '{column, ascending}' }
      },
      scopes: ['db:select'],
    },
    {
      name: 'nextmavens_insert',
      description: 'Insert a row into a database table',
      inputSchema: {
        table: { type: 'string', required: true },
        data: { type: 'object', required: true, description: 'Data to insert (key-value pairs)' }
      },
      scopes: ['db:insert'],
    },
    {
      name: 'nextmavens_update',
      description: 'Update rows in a database table',
      inputSchema: {
        table: { type: 'string', required: true },
        data: { type: 'object', required: true },
        filters: { type: 'array', required: true }
      },
      scopes: ['db:update'],
    },
    {
      name: 'nextmavens_delete',
      description: 'Delete rows in a database table',
      inputSchema: {
        table: { type: 'string', required: true },
        filters: { type: 'array', required: true }
      },
      scopes: ['db:delete'],
    },
  ],
}
