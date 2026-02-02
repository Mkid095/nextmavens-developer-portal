/**
 * Control Plane API - Organizations Module
 * Organization-related API methods
 */

import type {
  Organization,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  ListOrganizationsResponse,
  RequestHeaders,
} from './types'
import { BaseControlPlaneClient } from './base-client'

/**
 * Organizations API mixin
 * Extends the base client with organization-related methods
 */
export class OrganizationsApi extends BaseControlPlaneClient {
  /**
   * Create a new organization
   */
  async createOrganization(
    request: CreateOrganizationRequest,
    req?: RequestHeaders
  ): Promise<CreateOrganizationResponse> {
    return this.request<CreateOrganizationResponse>('/api/v1/orgs', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List organizations for the authenticated user
   */
  async listOrganizations(
    options?: { limit?: number; offset?: number },
    req?: RequestHeaders
  ): Promise<ListOrganizationsResponse> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    const queryString = params.toString()
    const endpoint = `/api/v1/orgs${queryString ? `?${queryString}` : ''}`
    return this.request<ListOrganizationsResponse>(endpoint, {}, req)
  }

  /**
   * Get a single organization by ID
   */
  async getOrganization(
    orgId: string,
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: Organization; members?: any[] }> {
    return this.request<{ success: boolean; data: Organization; members?: any[] }>(`/api/v1/orgs/${orgId}`, {}, req)
  }

  /**
   * Update an organization
   */
  async updateOrganization(
    orgId: string,
    request: { name?: string },
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: Organization }> {
    return this.request<{ success: boolean; data: Organization }>(`/api/v1/orgs/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List all members of an organization
   */
  async listOrganizationMembers(
    orgId: string,
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: any[] }> {
    return this.request<{ success: boolean; data: any[] }>(`/api/v1/orgs/${orgId}/members`, {}, req)
  }

  /**
   * Remove a member from an organization
   */
  async removeOrganizationMember(
    orgId: string,
    userId: string,
    req?: RequestHeaders
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/orgs/${orgId}/members/${userId}`, {
      method: 'DELETE',
    }, req)
  }

  /**
   * Invite a member to an organization by email
   */
  async inviteOrganizationMember(
    orgId: string,
    request: { email: string; role: 'owner' | 'admin' | 'developer' | 'viewer' },
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: { id: string; org_id: string; email: string; role: string; status: string; invited_by: string; created_at: string; expires_at: string } }> {
    return this.request<{ success: boolean; data: { id: string; org_id: string; email: string; role: string; status: string; invited_by: string; created_at: string; expires_at: string } }>(`/api/v1/orgs/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * Update a member's role in an organization
   */
  async updateOrganizationMemberRole(
    orgId: string,
    userId: string,
    request: { role: 'owner' | 'admin' | 'developer' | 'viewer' },
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: { org_id: string; user_id: string; role: string; joined_at: string } }> {
    return this.request<{ success: boolean; data: { org_id: string; user_id: string; role: string; joined_at: string } }>(`/api/v1/orgs/${orgId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, req)
  }
}
