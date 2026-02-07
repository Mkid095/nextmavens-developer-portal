/**
 * Control Plane Organization Repository
 * Handles all organization-related database operations for the Control Plane API
 */

import { ControlPlaneBaseRepository } from './base/base-repository'
import { connectionManager } from '../../lib/connection-manager'

export interface ControlPlaneOrganization {
  id: string
  name: string
  slug: string
  owner_id: string
  settings: Record<string, any>
  created_at: Date
  updated_at: Date | null
  deleted_at: Date | null
}

export interface CreateOrganizationInput {
  name: string
  slug?: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'accepted' | 'rejected'
  accepted_at: Date | null
  created_at: Date
}

export interface OrganizationListOptions {
  limit?: number
  offset?: number
}

/**
 * Control Plane Organization Repository
 */
export class ControlPlaneOrganizationRepository extends ControlPlaneBaseRepository<ControlPlaneOrganization> {
  protected tableName = 'organizations' // in control_plane schema
  protected primaryKey = 'id'

  /**
   * Find organizations by developer member
   */
  async findByDeveloper(
    developerId: string,
    options: OrganizationListOptions = {}
  ): Promise<{
    data: Array<ControlPlaneOrganization & { member_count: number }>
    total: number
    error: Error | null
  }> {
    try {
      const { limit = 50, offset = 0 } = options

      // Get count
      const countResult = await this.executeQuery<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM control_plane.${this.tableName} o
         INNER JOIN control_plane.organization_members om ON o.id = om.org_id
         WHERE om.user_id = $1
           AND om.status = 'accepted'
           AND o.deleted_at IS NULL`,
        [developerId]
      )

      // Get data
      const dataResult = await this.executeQuery<any>(
        `SELECT
          o.id, o.name, o.slug, o.owner_id, o.created_at, o.updated_at,
          COUNT(om.id) as member_count
        FROM control_plane.${this.tableName} o
        INNER JOIN control_plane.organization_members om ON o.id = om.org_id
        WHERE om.user_id = $1
          AND om.status = 'accepted'
          AND o.deleted_at IS NULL
        GROUP BY o.id, o.name, o.slug, o.owner_id, o.created_at, o.updated_at
        ORDER BY o.created_at DESC
        LIMIT $2 OFFSET $3`,
        [developerId, limit, offset]
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
   * Check if organization with slug exists
   */
  async existsBySlug(slug: string): Promise<{ exists: boolean; error: Error | null }> {
    try {
      const result = await this.executeQuery<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM control_plane.${this.tableName}
         WHERE slug = $1 AND deleted_at IS NULL`,
        [slug]
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
   * Create organization with owner as member
   */
  async createWithOwner(
    input: CreateOrganizationInput & { ownerId: string }
  ): Promise<{
    data: ControlPlaneOrganization | null
    error: Error | null
  }> {
    try {
      const organization = await connectionManager.transaction(async (client) => {
        // Generate slug if not provided
        const slug = input.slug || input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        // Create organization
        const orgResult = await client.query(
          `INSERT INTO control_plane.${this.tableName} (name, slug, owner_id, settings)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, slug, owner_id, settings, created_at, updated_at`,
          [input.name, slug, input.ownerId, {}]
        )

        const organization = orgResult.rows[0]

        // Add the owner as a member
        await client.query(
          `INSERT INTO control_plane.organization_members (org_id, user_id, role, status, accepted_at)
           VALUES ($1, $2, 'owner', 'accepted', NOW())`,
          [organization.id, input.ownerId]
        )

        return organization as ControlPlaneOrganization
      })
      return {
        data: organization,
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
   * Validate organization access (member check)
   */
  async validateAccess(
    orgId: string,
    developerId: string,
    requireAdmin: boolean = false
  ): Promise<{
    valid: boolean
    organization?: ControlPlaneOrganization
    member?: OrganizationMember
    error: Error | null
  }> {
    try {
      // Check if user is a member of the organization
      const memberResult = await this.executeQuery<any>(
        `SELECT om.id, om.org_id, om.user_id, om.role, om.status,
                o.name, o.slug, o.owner_id
         FROM control_plane.organization_members om
         JOIN control_plane.organizations o ON o.id = om.org_id
         WHERE om.org_id = $1 AND om.user_id = $2`,
        [orgId, developerId]
      )

      if (!memberResult.data || memberResult.data.length === 0) {
        return {
          valid: false,
          error: null,
        }
      }

      const member = memberResult.data[0]
      const organization = {
        id: member.org_id,
        name: member.name,
        slug: member.slug,
        owner_id: member.owner_id,
        settings: {},
        created_at: member.created_at,
        updated_at: null,
        deleted_at: null,
      }

      // Check membership status
      if (member.status !== 'accepted') {
        return {
          valid: false,
          organization,
          error: null,
        }
      }

      // If admin access is required, check role
      if (requireAdmin && member.role !== 'owner' && member.role !== 'admin') {
        return {
          valid: false,
          organization,
          member,
          error: null,
        }
      }

      return {
        valid: true,
        organization,
        member,
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
export const controlPlaneOrganizationRepository = new ControlPlaneOrganizationRepository()
