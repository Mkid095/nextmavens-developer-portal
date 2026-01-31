/**
 * Secrets API Client
 * PRD: US-010 from prd-secrets-versioning.json
 *
 * Client-side API wrapper for secrets management
 */

import type {
  ApiResponse,
  Secret,
  SecretDetails,
  SecretVersion,
  CreateSecretRequest,
  RotateSecretRequest,
  RotateSecretResponse,
  DeleteSecretResponse,
} from '@/lib/types/secrets.types'

const API_BASE = '/api/v1/secrets'

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('No authentication token found')
  }

  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'Request failed')
  }

  return data
}

/**
 * Secrets API Client
 */
export const secretsApi = {
  /**
   * List secrets for a project (without values)
   * GET /api/v1/secrets?project_id=xxx
   */
  async list(
    projectId: string,
    options?: { active?: boolean; limit?: number; offset?: number }
  ): Promise<ApiResponse<Secret[]>> {
    const params = new URLSearchParams({ project_id: projectId })
    if (options?.active !== undefined) params.set('active', String(options.active))
    if (options?.limit) params.set('limit', String(options.limit))
    if (options?.offset) params.set('offset', String(options.offset))

    return apiRequest<Secret[]>(`?${params.toString()}`)
  },

  /**
   * Create a new secret
   * POST /api/v1/secrets
   */
  async create(data: CreateSecretRequest): Promise<ApiResponse<Secret>> {
    return apiRequest<Secret>('', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get secret details (with decrypted value)
   * GET /api/v1/secrets/:id
   */
  async get(id: string): Promise<ApiResponse<SecretDetails>> {
    return apiRequest<SecretDetails>(`/${id}`)
  },

  /**
   * Rotate a secret to a new version
   * POST /api/v1/secrets/:id/rotate
   */
  async rotate(
    id: string,
    data: RotateSecretRequest
  ): Promise<ApiResponse<RotateSecretResponse>> {
    return apiRequest<RotateSecretResponse>(`/${id}/rotate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * List all versions of a secret
   * GET /api/v1/secrets/:id/versions
   */
  async listVersions(id: string): Promise<ApiResponse<SecretVersion[]>> {
    return apiRequest<SecretVersion[]>(`/${id}/versions`)
  },

  /**
   * Get a specific version of a secret
   * GET /api/v1/secrets/:id/versions/:version
   */
  async getVersion(id: string, version: number): Promise<ApiResponse<SecretDetails>> {
    return apiRequest<SecretDetails>(`/${id}/versions/${version}`)
  },

  /**
   * Delete a secret (soft delete)
   * DELETE /api/v1/secrets/:id
   */
  async delete(id: string): Promise<ApiResponse<DeleteSecretResponse>> {
    return apiRequest<DeleteSecretResponse>(`/${id}`, {
      method: 'DELETE',
    })
  },
}
