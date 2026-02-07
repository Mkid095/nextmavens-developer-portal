/**
 * Control Plane API Key Repository
 * Handles all API key-related database operations for the Control Plane API
 */

import { ControlPlaneBaseRepository } from './base/base-repository'
import { connectionManager } from '../../lib/connection-manager'

export interface ControlPlaneApiKey {
  id: string
  project_id: string
  key_type: string
  key_prefix: string
  key_hash: string
  name: string | null
  scopes: string[]
  environment: string
  status: string | null
  usage_count: number | null
  last_used: Date | null
  created_at: Date
}

export interface CreateApiKeyInput {
  project_id: string
  key_type: string
  key_prefix: string
  key_hash: string
  name?: string
  scopes?: string[]
  environment: string
}

export interface ApiKeyListOptions {
  project_id?: string
  key_type?: string
  environment?: string
  limit?: number
  offset?: number
}

/**
 * Control Plane API Key Repository
 */
export class ControlPlaneApiKeyRepository extends ControlPlaneBaseRepository<ControlPlaneApiKey> {
  protected tableName = 'api_keys'
  protected primaryKey = 'id'

  /**
   * Find API keys by developer (through their projects)
   */
  async findByDeveloper(
    developerId: string,
    options: ApiKeyListOptions = {}
  ): Promise<{
    data: Array<ControlPlaneApiKey & { project_name: string }>
    total: number
    error: Error | null
  }> {
    try {
      const { project_id, key_type, environment, limit = 50, offset = 0 } = options

      // Build query with filters
      const conditions: string[] = ['p.developer_id = $1']
      const values: any[] = [developerId]
      let paramIndex = 2

      if (project_id) {
        conditions.push(`ak.project_id = $${paramIndex++}`)
        values.push(project_id)
      }

      if (key_type) {
        conditions.push(`ak.key_type = $${paramIndex++}`)
        values.push(key_type)
      }

      if (environment) {
        conditions.push(`ak.environment = $${paramIndex++}`)
        values.push(environment)
      }

      // Filter out revoked/expired keys by default
      conditions.push(`(ak.status IS NULL OR ak.status = 'active')`)

      const whereClause = conditions.join(' AND ')

      // Get count
      const countResult = await this.executeQuery<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM ${this.tableName} ak
         JOIN projects p ON ak.project_id = p.id
         WHERE ${whereClause}`,
        values
      )

      // Get data
      values.push(limit, offset)
      const dataResult = await this.executeQuery<any>(
        `SELECT
          ak.id, ak.key_type, ak.key_prefix, ak.scopes, ak.environment,
          ak.name, ak.status, ak.usage_count, ak.last_used, ak.created_at,
          p.id as project_id, p.project_name
        FROM ${this.tableName} ak
        JOIN projects p ON ak.project_id = p.id
        WHERE ${whereClause}
        ORDER BY ak.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      )

      return {
        data: dataResult.data || [],
        total: parseInt(countResult.data?.[0]?.count || '0'),
        error: null,
      }
    } catch (error) {
      return {
        data: [],
        total: 0,
        error: error as Error,
      }
    }
  }

  /**
   * Create API key with column existence check
   */
  async createWithColumns(input: CreateApiKeyInput): Promise<{
    data: ControlPlaneApiKey | null
    error: Error | null
  }> {
    try {
      // Ensure columns exist (idempotent)
      await this.ensureColumns()

      const result = await this.executeQuery<ControlPlaneApiKey>(
        `INSERT INTO ${this.tableName} (project_id, key_type, key_prefix, key_hash, name, scopes, environment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          input.project_id,
          input.key_type,
          input.key_prefix,
          input.key_hash,
          input.name || null,
          input.scopes || [],
          input.environment,
        ]
      )

      return {
        data: result.data?.[0] || null,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  /**
   * Ensure API key columns exist (for backwards compatibility)
   */
  private async ensureColumns(): Promise<void> {
    const columns = [
      { name: 'name', sql: 'VARCHAR(255)' },
      { name: 'environment', sql: "api_key_environment DEFAULT 'live'" },
      { name: 'status', sql: "VARCHAR(20) DEFAULT 'active'" },
      { name: 'usage_count', sql: 'INTEGER DEFAULT 0' },
      { name: 'last_used', sql: 'TIMESTAMPTZ' },
    ]

    for (const column of columns) {
      try {
        await this.executeQuery(
          `ALTER TABLE ${this.tableName} ADD COLUMN IF NOT EXISTS ${column.name} ${column.sql}`
        )
      } catch {
        // Column might already exist, ignore
      }
    }
  }

  /**
   * Find project by ID for ownership validation
   */
  async findProjectById(projectId: string): Promise<{
    data: {
      id: string
      developer_id: string
      project_name: string
      tenant_id: string
      status: string
      environment: string
    } | null
    error: Error | null
  }> {
    try {
      const result = await this.executeQuery<any>(
        `SELECT id, developer_id, project_name, tenant_id, status, environment
         FROM projects
         WHERE id = $1`,
        [projectId]
      )

      return {
        data: result.data?.[0] || null,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      }
    }
  }

  /**
   * Validate project ownership
   */
  async validateProjectOwnership(
    projectId: string,
    developerId: string
  ): Promise<{
    valid: boolean
    project?: any
    error: Error | null
  }> {
    try {
      const projectResult = await this.findProjectById(projectId)

      if (!projectResult.data) {
        return {
          valid: false,
          error: projectResult.error,
        }
      }

      const project = projectResult.data

      // Check if user is the owner
      if (String(project.developer_id) !== String(developerId)) {
        return {
          valid: false,
          project,
          error: null,
        }
      }

      return {
        valid: true,
        project,
        error: null,
      }
    } catch (error) {
      return {
        valid: false,
        error: error as Error,
      }
    }
  }
}

// Export singleton instance
export const controlPlaneApiKeyRepository = new ControlPlaneApiKeyRepository()
