/**
 * MCP Tools - Realtime Management
 */

import type { ToolCategory } from '../types'
import { Clock } from 'lucide-react'

export const realtimeTools: ToolCategory = {
  category: 'Realtime Management',
  icon: Clock,
  tools: [
    {
      name: 'nextmavens_enable_realtime',
      description: 'Enable realtime for a table',
      inputSchema: {
        tableName: { type: 'string', required: true }
      },
      scopes: ['realtime:manage'],
    },
    {
      name: 'nextmavens_disable_realtime',
      description: 'Disable realtime for a table',
      inputSchema: {
        tableName: { type: 'string', required: true }
      },
      scopes: ['realtime:manage'],
    },
    {
      name: 'nextmavens_list_realtime_tables',
      description: 'List tables with realtime enabled',
      inputSchema: {},
      scopes: ['realtime:read'],
    },
    {
      name: 'nextmavens_realtime_connection_info',
      description: 'Get realtime connection information',
      inputSchema: {},
      scopes: ['realtime:read'],
    },
  ],
}
