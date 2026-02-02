/**
 * MCP Tools - Storage Management
 */

import type { ToolCategory } from '../types'
import { Folder } from 'lucide-react'

export const storageManagementTools: ToolCategory = {
  category: 'Storage Management',
  icon: Folder,
  tools: [
    {
      name: 'nextmavens_create_bucket',
      description: 'Create a storage bucket',
      inputSchema: {
        name: { type: 'string', required: true },
        publicAccess: { type: 'boolean', description: 'Allow public access' },
        fileSizeLimit: { type: 'number', description: 'Max file size in bytes' }
      },
      scopes: ['storage:admin'],
    },
    {
      name: 'nextmavens_list_buckets',
      description: 'List all storage buckets',
      inputSchema: {},
      scopes: ['storage:read'],
    },
    {
      name: 'nextmavens_delete_bucket',
      description: 'Delete a storage bucket',
      inputSchema: {
        bucketId: { type: 'string', required: true }
      },
      scopes: ['storage:delete'],
    },
    {
      name: 'nextmavens_create_folder',
      description: 'Create a folder in a bucket',
      inputSchema: {
        bucketId: { type: 'string', required: true },
        folderPath: { type: 'string', required: true }
      },
      scopes: ['storage:write'],
    },
    {
      name: 'nextmavens_update_bucket',
      description: 'Update bucket settings',
      inputSchema: {
        bucketId: { type: 'string', required: true },
        publicAccess: { type: 'boolean' },
        fileSizeLimit: { type: 'number' }
      },
      scopes: ['storage:admin'],
    },
  ],
}
