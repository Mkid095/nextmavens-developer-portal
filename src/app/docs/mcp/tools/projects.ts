/**
 * MCP Tools - Project Management
 */

import type { ToolCategory } from '../types'
import { Server } from 'lucide-react'

export const projectTools: ToolCategory = {
  category: 'Project Management',
  icon: Server,
  tools: [
    {
      name: 'nextmavens_create_project',
      description: 'Create a new project',
      inputSchema: {
        name: { type: 'string', required: true },
        description: { type: 'string' },
        domain: { type: 'string' }
      },
      scopes: ['project:create'],
    },
    {
      name: 'nextmavens_list_projects',
      description: 'List all projects',
      inputSchema: {},
      scopes: ['project:read'],
    },
    {
      name: 'nextmavens_get_project',
      description: 'Get project details',
      inputSchema: {
        projectId: { type: 'string', required: true }
      },
      scopes: ['project:read'],
    },
    {
      name: 'nextmavens_update_project',
      description: 'Update a project',
      inputSchema: {
        projectId: { type: 'string', required: true },
        name: { type: 'string' },
        description: { type: 'string' },
        domain: { type: 'string' }
      },
      scopes: ['project:update'],
    },
    {
      name: 'nextmavens_delete_project',
      description: 'Delete a project',
      inputSchema: {
        projectId: { type: 'string', required: true }
      },
      scopes: ['project:delete'],
    },
  ],
}
