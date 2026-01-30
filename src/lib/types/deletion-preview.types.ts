/**
 * Deletion Preview Types
 *
 * Types for the deletion preview API that shows what will be deleted
 * when a project is deleted, including counts and dependencies.
 */

/**
 * Counts of resources that will be deleted
 */
export interface DeletionCounts {
  /** Number of database schemas */
  schemas: number
  /** Number of database tables */
  tables: number
  /** Number of API keys */
  api_keys: number
  /** Number of webhooks */
  webhooks: number
  /** Number of edge functions */
  edge_functions: number
  /** Number of storage buckets */
  storage_buckets: number
  /** Number of secrets */
  secrets: number
}

/**
 * A dependency that will be affected by deletion
 */
export interface DeletionDependency {
  /** Type of dependency */
  type: 'webhook' | 'storage' | 'api_key' | 'database' | 'edge_function' | 'secret'
  /** Target identifier (URL, bucket name, etc.) */
  target: string
  /** Description of the impact */
  impact: string
}

/**
 * Project details for deletion preview
 */
export interface DeletionPreviewProject {
  id: string
  name: string
  slug: string
  tenant_id: string
  status: string
}

/**
 * Deletion preview response
 */
export interface DeletionPreviewResponse {
  /** Project details */
  project: DeletionPreviewProject
  /** Counts of resources that will be deleted */
  will_be_deleted: DeletionCounts
  /** Dependencies and their impacts */
  dependencies: DeletionDependency[]
  /** Date until which the project can be recovered (ISO 8601) */
  recoverable_until: string
}
