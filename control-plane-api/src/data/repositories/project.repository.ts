/**
 * Control Plane Project Repository
 * Handles all project-related database operations for the Control Plane API
 */

import { ControlPlaneBaseRepository } from './base/base-repository'
import { connectionManager } from '../../lib/connection-manager'

export interface ControlPlaneProject {
  id: string
  developer_id: string
  project_name: string
  tenant_id: string
  environment: string
  webhook_url: string | null
  allowed_origins: string[] | null
  rate_limit: number
  status: string
  created_at: Date
  updated_at: Date | null
  deleted_at: Date | null
  deletion_scheduled_at: Date | null
  grace_period_ends_at: Date | null
  organization_id: string | null
}

export interface CreateProjectInput {
  project_name: string
  environment?: string
  webhook_url?: string
  allowed_origins?: string[]
}

export interface ProjectListOptions {
  status?: string
  environment?: string
  organization_id?: string
  limit?: number
  offset?: number
}

export interface ControlPlaneProjectWithSlug extends ControlPlaneProject {
  tenant_slug: string
}

/**
 * Control Plane Project Repository
 */
export class ControlPlaneProjectRepository extends ControlPlaneBaseRepository<ControlPlaneProject> {
  protected tableName = 'projects'
  protected primaryKey = 'id'

  /**
   * Find projects by developer with organization scoping
   * US-012: Returns personal projects (only for owner) and org projects (for all org members)
   */
  async findByDeveloperWithOrgScoping(
    developerId: string,
    options: ProjectListOptions = {}
  ): Promise<{
    data: ControlPlaneProjectWithSlug[]
    total: number
    error: Error | null
  }> {
    try {
      const { status, environment, organization_id, limit = 50, offset = 0 } = options

      // Build query with org membership filtering
      const conditions: string[] = [
        `(
          -- Personal projects: only visible to owner
          (p.organization_id IS NULL AND p.developer_id = $1)
          OR
          -- Org projects: visible to all org members
          (p.organization_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM control_plane.organization_members om
            WHERE om.org_id = p.organization_id
              AND om.user_id = $1
              AND om.status = 'accepted'
          ))
        )`
      ]
      const values: any[] = [developerId]
      let paramIndex = 2

      if (status) {
        conditions.push(`p.status = $${paramIndex++}`)
        values.push(status)
      }

      if (environment) {
        conditions.push(`p.environment = $${paramIndex++}`)
        values.push(environment)
      }

      if (organization_id) {
        conditions.push(`p.organization_id = $${paramIndex++}`)
        values.push(organization_id)
      }

      const whereClause = conditions.join(' AND ')

      // Get count
      const countResult = await this.executeQuery<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM ${this.tableName} p
         WHERE ${whereClause}`,
        values
      )

      // Get data with tenant slug
      values.push(limit, offset)
      const dataResult = await this.executeQuery<any>(
        `SELECT
          p.id, p.project_name, p.tenant_id, p.webhook_url,
          p.allowed_origins, p.rate_limit, p.status, p.environment, p.created_at,
          p.deleted_at, p.deletion_scheduled_at, p.grace_period_ends_at,
          p.organization_id,
          t.slug as tenant_slug
        FROM ${this.tableName} p
        JOIN tenants t ON p.tenant_id = t.id
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
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
   * Find project by ID with ownership validation
   */
  async findByIdWithOwnership(
    projectId: string,
    developerId: string
  ): Promise<{
    data: ControlPlaneProject | null
    hasAccess: boolean
    error: Error | null
  }> {
    try {
      const result = await this.executeQuery<ControlPlaneProject>(
        `SELECT id, developer_id, project_name, tenant_id, organization_id, status, environment
         FROM ${this.tableName}
         WHERE id = $1`,
        [projectId]
      )

      if (!result.data || result.data.length === 0) {
        return {
          data: null,
          hasAccess: false,
          error: null,
        }
      }

      const project = result.data[0]

      // Check ownership
      let hasAccess = false

      if (!project.organization_id) {
        // Personal project: only owner has access
        hasAccess = String(project.developer_id) === String(developerId)
      } else {
        // Org project: check if developer is a member
        const memberCheck = await this.executeQuery<{ is_member: boolean }>(
          `SELECT EXISTS(
            SELECT 1 FROM control_plane.organization_members
            WHERE org_id = $1 AND user_id = $2 AND status = 'accepted'
          ) as is_member`,
          [project.organization_id, developerId]
        )

        hasAccess = memberCheck.data?.[0]?.is_member || false
      }

      return {
        data: project,
        hasAccess,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        hasAccess: false,
        error: error as Error,
      }
    }
  }

  /**
   * Check if project with same name exists for developer
   */
  async existsByNameForDeveloper(
    projectName: string,
    developerId: string
  ): Promise<{ exists: boolean; error: Error | null }> {
    try {
      const result = await this.executeQuery<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM ${this.tableName} p
         JOIN tenants t ON p.tenant_id = t.id
         WHERE p.developer_id = $1 AND t.name = $2`,
        [developerId, projectName]
      )

      return {
        exists: parseInt(result.data?.[0]?.count || '0') > 0,
        error: null,
      }
    } catch (error) {
      return {
        exists: false,
        error: error as Error,
      }
    }
  }

  /**
   * Create project with tenant
   */
  async createWithTenant(
    input: CreateProjectInput & { developerId: string }
  ): Promise<{
    data: ControlPlaneProject & { slug: string } | null
    error: Error | null
  }> {
    try {
      const project = await connectionManager.transaction(async (client) => {
        // Generate slug from project name
        const slug = input.project_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        // Create tenant
        const tenantResult = await client.query(
          `INSERT INTO tenants (name, slug, settings)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [input.project_name, slug, {}]
        )

        const tenantId = tenantResult.rows[0].id

        // Create project
        const projectResult = await client.query(
          `INSERT INTO ${this.tableName} (
             developer_id, project_name, tenant_id, environment, webhook_url, allowed_origins, rate_limit, status
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            input.developerId,
            input.project_name,
            tenantId,
            input.environment || 'prod',
            input.webhook_url || null,
            input.allowed_origins || null,
            1000, // default rate limit
            'active', // default status
          ]
        )

        const project = projectResult.rows[0]

        return {
          ...project,
          slug,
        } as ControlPlaneProject & { slug: string }
      })
      return {
        data: project,
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
   * Get developer's first project (for default API key creation)
   */
  async findFirstByDeveloper(developerId: string): Promise<{
    data: ControlPlaneProject | null
    error: Error | null
  }> {
    try {
      const result = await this.executeQuery<ControlPlaneProject>(
        `SELECT * FROM ${this.tableName}
         WHERE developer_id = $1
         ORDER BY created_at ASC
         LIMIT 1`,
        [developerId]
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
}

// Export singleton instance
export const controlPlaneProjectRepository = new ControlPlaneProjectRepository()
