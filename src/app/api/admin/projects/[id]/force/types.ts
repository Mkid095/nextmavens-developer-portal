/**
 * Force Delete Route - Type Definitions
 *
 * US-006: Implement Force Delete Power
 */

import type {
  ForceDeleteProjectRequest,
  ForceDeleteProjectResponse,
  ForceDeleteProjectError,
} from '@/features/break-glass/types/force-delete-project.types'

export type {
  ForceDeleteProjectRequest,
  ForceDeleteProjectResponse,
  ForceDeleteProjectError,
}

export interface ForceDeleteHistoryResponse {
  project_id: string
  force_delete_count: number
  force_deletes: unknown[]
}
