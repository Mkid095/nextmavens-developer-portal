/**
 * Control Plane API - API Keys Module
 * API key-related methods
 */

import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RotateKeyResponse,
  RevokeKeyResponse,
  RequestHeaders,
} from './types'
import { BaseControlPlaneClient } from './base-client'

/**
 * API Keys API mixin
 * Extends the base client with API key-related methods
 */
export class ApiKeysApi extends BaseControlPlaneClient {
  /**
   * List API keys for the authenticated user
   */
  async listApiKeys(
    req?: RequestHeaders
  ): Promise<{ apiKeys: ApiKey[] }> {
    return this.request<{ apiKeys: ApiKey[] }>('/api/v1/keys', {}, req)
  }

  /**
   * Create a new API key
   */
  async createApiKey(
    request: CreateApiKeyRequest,
    req?: RequestHeaders
  ): Promise<CreateApiKeyResponse> {
    return this.request<CreateApiKeyResponse>('/api/v1/keys', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * Rotate an API key
   */
  async rotateApiKey(
    keyId: string,
    req?: RequestHeaders
  ): Promise<RotateKeyResponse> {
    return this.request<RotateKeyResponse>(`/api/v1/keys/${keyId}/rotate`, {
      method: 'PUT',
    }, req)
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(
    keyId: string,
    req?: RequestHeaders
  ): Promise<RevokeKeyResponse> {
    return this.request<RevokeKeyResponse>(`/api/v1/keys/${keyId}/revoke`, {
      method: 'DELETE',
    }, req)
  }
}
