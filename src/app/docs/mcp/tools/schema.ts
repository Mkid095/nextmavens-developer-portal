/**
 * MCP Tools - Schema Management
 */

import type { ToolCategory } from '../types'
import { FolderTree } from 'lucide-react'

export const schemaTools: ToolCategory = {
  category: 'Schema Management',
  icon: FolderTree,
  tools: [
    {
      name: 'nextmavens_create_table',
      description: 'Create a new database table with columns',
      inputSchema: {
        tableName: { type: 'string', required: true },
        columns: {
          type: 'array',
          required: true,
          description: 'Array of column definitions: [{name, type, nullable, unique, default}]'
        },
        primaryKeys: { type: 'array', description: 'Primary key columns' }
      },
      scopes: ['db:admin'],
    },
    {
      name: 'nextmavens_add_column',
      description: 'Add a column to an existing table',
      inputSchema: {
        tableName: { type: 'string', required: true },
        column: {
          type: 'object',
          required: true,
          description: '{name, type, nullable, default}'
        }
      },
      scopes: ['db:admin'],
    },
    {
      name: 'nextmavens_create_policy',
      description: 'Create or update an RLS policy on a table',
      inputSchema: {
        tableName: { type: 'string', required: true },
        policyName: { type: 'string', required: true },
        operation: {
          type: 'string',
          required: true,
          enum: ['select', 'insert', 'update', 'delete', 'all']
        },
        using: { type: 'string', description: 'USING expression for RLS' },
        check: { type: 'string', description: 'WITH CHECK expression for RLS' },
        roles: { type: 'array', description: 'Array of role names' }
      },
      scopes: ['db:admin'],
    },
    {
      name: 'nextmavens_enable_rls',
      description: 'Enable Row Level Security on a table',
      inputSchema: {
        tableName: { type: 'string', required: true }
      },
      scopes: ['db:admin'],
    },
    {
      name: 'nextmavens_list_tables',
      description: 'List all database tables',
      inputSchema: {},
      scopes: ['db:select'],
    },
    {
      name: 'nextmavens_get_table_schema',
      description: 'Get schema information for a table',
      inputSchema: {
        tableName: { type: 'string', required: true }
      },
      scopes: ['db:select'],
    },
  ],
}
