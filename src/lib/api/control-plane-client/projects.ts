/**
 * Control Plane API - Projects Module
 * Project-related API methods
 */

import type { DeletionPreviewResponse } from '@/lib/types/deletion-preview.types'
import type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  RequestHeaders,
} from './types'
import { BaseControlPlaneClient } from './base-client'

/**
 * Projects API mixin
 * Extends the base client with project-related methods
 */
export class ProjectsApi extends BaseControlPlaneClient {
  /**
   * Create a new project
   */
  async createProject(
    request: CreateProjectRequest,
    req?: RequestHeaders
  ): Promise<CreateProjectResponse> {
    return this.request<CreateProjectResponse>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List all projects for the authenticated user
   */
  async listProjects(
    options?: { status?: 'active' | 'suspended' | 'archived' | 'deleted' },
    req?: RequestHeaders
  ): Promise<{ success: boolean; data: Project[]; meta?: { limit: number; offset: number } }> {
    const params = new URLSearchParams()
    if (options?.status) {
      params.append('status', options.status)
    }
    const queryString = params.toString()
    const endpoint = `/api/v1/projects${queryString ? `?${queryString}` : ''}`
    return this.request<{ success: boolean; data: Project[]; meta?: { limit: number; offset: number } }>(endpoint, {}, req)
  }

  /**
   * Get a single project by ID
   */
  async getProject(
    projectId: string,
    req?: RequestHeaders
  ): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/api/v1/projects/${projectId}`, {}, req)
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    request: UpdateProjectRequest,
    req?: RequestHeaders
  ): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/api/v1/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * Delete a project (soft delete)
   */
  async deleteProject(
    projectId: string,
    req?: RequestHeaders
  ): Promise<{ message: string; project_id: string }> {
    return this.request<{ message: string; project_id: string }>(`/api/v1/projects/${projectId}`, {
      method: 'DELETE',
    }, req)
  }

  /**
   * Restore a soft-deleted project
   */
  async restoreProject(
    projectId: string,
    req?: RequestHeaders
  ): Promise<{ message: string; project: any }> {
    return this.request<{ message: string; project: any }>(`/api/v1/projects/${projectId}/restore`, {
      method: 'POST',
    }, req)
  }

  /**
   * Get deletion preview for a project
   */
  async getDeletionPreview(
    projectId: string,
    req?: RequestHeaders
  ): Promise<DeletionPreviewResponse> {
    return this.request<DeletionPreviewResponse>(`/api/v1/projects/${projectId}/deletion-preview`, {}, req)
  }
}
