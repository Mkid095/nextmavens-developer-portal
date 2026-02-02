/**
 * Control Plane API - Secrets Module
 * Secret-related API methods
 */

import type {
  SecretResponse,
  CreateSecretRequest,
  CreateSecretResponse,
  RotateSecretRequest,
  RotateSecretResponse,
  ListSecretsQuery,
  ListSecretsResponse,
  GetSecretResponse,
  ListSecretVersionsResponse,
  RequestHeaders,
} from '@/lib/types/secret.types'
import { BaseControlPlaneClient } from './base-client'

/**
 * Secrets API mixin
 * Extends the base client with secret-related methods
 */
export class SecretsApi extends BaseControlPlaneClient {
  /**
   * Create a new secret
   */
  async createSecret(
    request: CreateSecretRequest,
    req?: RequestHeaders
  ): Promise<CreateSecretResponse> {
    return this.request<CreateSecretResponse>('/api/v1/secrets', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List secrets for a project
   */
  async listSecrets(
    query: ListSecretsQuery,
    req?: RequestHeaders
  ): Promise<ListSecretsResponse> {
    const params = new URLSearchParams()
    params.append('project_id', query.project_id)
    if (query.active !== undefined) params.append('active', query.active.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.offset) params.append('offset', query.offset.toString())
    const queryString = params.toString()
    const endpoint = `/api/v1/secrets${queryString ? `?${queryString}` : ''}`
    return this.request<ListSecretsResponse>(endpoint, {}, req)
  }

  /**
   * Get a single secret by ID (with decrypted value)
   */
  async getSecret(
    secretId: string,
    req?: RequestHeaders
  ): Promise<GetSecretResponse> {
    return this.request<GetSecretResponse>(`/api/v1/secrets/${secretId}`, {}, req)
  }

  /**
   * Rotate a secret
   */
  async rotateSecret(
    secretId: string,
    request: RotateSecretRequest,
    req?: RequestHeaders
  ): Promise<RotateSecretResponse> {
    return this.request<RotateSecretResponse>(`/api/v1/secrets/${secretId}/rotate`, {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List all versions of a secret
   */
  async listSecretVersions(
    secretId: string,
    req?: RequestHeaders
  ): Promise<ListSecretVersionsResponse> {
    return this.request<ListSecretVersionsResponse>(`/api/v1/secrets/${secretId}/versions`, {}, req)
  }

  /**
   * Delete a secret (soft delete)
   */
  async deleteSecret(
    secretId: string,
    req?: RequestHeaders
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/secrets/${secretId}`, {
      method: 'DELETE',
    }, req)
  }
}
