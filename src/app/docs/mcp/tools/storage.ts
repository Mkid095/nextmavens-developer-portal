/**
 * MCP Tools - Storage (Telegram Files)
 */

import type { ToolCategory } from '../types'
import { Cloud } from 'lucide-react'

export const storageTools: ToolCategory = {
  category: 'Storage (Telegram Files)',
  icon: Cloud,
  tools: [
    {
      name: 'nextmavens_file_info',
      description: 'Get information about a file by ID from Telegram storage',
      inputSchema: {
        fileId: { type: 'string', required: true, description: 'File ID from Telegram storage' }
      },
      scopes: ['storage:read'],
    },
    {
      name: 'nextmavens_file_download_url',
      description: 'Get a download URL for a file',
      inputSchema: {
        fileId: { type: 'string', required: true }
      },
      scopes: ['storage:read'],
    },
    {
      name: 'nextmavens_list_files',
      description: 'List files with optional filters',
      inputSchema: {
        tenantId: { type: 'string', description: 'Filter by tenant ID' },
        fileType: { type: 'string', description: 'Filter by file type' },
        limit: { type: 'number' },
        offset: { type: 'number' }
      },
      scopes: ['storage:read'],
    },
  ],
}
