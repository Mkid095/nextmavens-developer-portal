/**
 * MCP Tools - All Categories
 */

import type { ToolCategory } from '../types'
import { databaseTools } from './database'
import { authTools } from './auth'
import { storageTools } from './storage'
import { graphqlTools } from './graphql'
import { schemaTools } from './schema'
import { projectTools } from './projects'
import { apiKeyTools } from './keys'
import { realtimeTools } from './realtime'
import { storageManagementTools } from './buckets'

export const mcpTools: ToolCategory[] = [
  databaseTools,
  authTools,
  storageTools,
  graphqlTools,
  schemaTools,
  projectTools,
  apiKeyTools,
  realtimeTools,
  storageManagementTools,
]
