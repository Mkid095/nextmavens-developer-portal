/**
 * Control Plane API Client
 * Client for interacting with the Control Plane API for projects, API keys, and governance operations
 */

import type { DeletionPreviewResponse } from '@/lib/types/deletion-preview.types'
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
} from '@/lib/types/secret.types'
import type {
  Webhook,
  CreateWebhookRequest,
  CreateWebhookResponse,
  UpdateWebhookRequest,
  ListWebhooksQuery,
  ListWebhooksResponse,
  TestWebhookRequest,
  TestWebhookResponse,
  EventLog,
  ListEventLogsQuery,
  ListEventLogsResponse,
} from '@/lib/types/webhook.types'

// Type definitions for Control Plane API requests/responses

export interface Project {
  id: string
  name: string
  slug: string
  tenant_id: string
  status: 'active' | 'suspended' | 'archived' | 'deleted'
  environment?: string
  webhook_url?: string
  allowed_origins?: string[]
  rate_limit?: number
  created_at: string
  updated_at?: string
  deleted_at?: string | null
  deletion_scheduled_at?: string | null
  grace_period_ends_at?: string | null
  recoverable_until?: string | null
  organization_id?: string | null
}

export interface CreateProjectRequest {
  project_name: string
  environment?: 'prod' | 'dev' | 'staging'
  webhook_url?: string
  allowed_origins?: string[]
}

export interface CreateProjectResponse {
  project: {
    id: string
    name: string
    slug: string
    tenant_id: string
    created_at: string
  }
  api_keys: {
    public_key: string
    secret_key: string
  }
  endpoints: {
    gateway: string
    auth: string
    graphql: string
    rest: string
    realtime: string
    storage: string
  }
  database_url: string
  warning: string
}

export interface UpdateProjectRequest {
  webhook_url?: string
  allowed_origins?: string[]
  rate_limit?: number
}

export interface ApiKey {
  id: string
  name?: string
  key_type: 'public' | 'secret' | 'service_role' | 'mcp'
  key_prefix: string
  scopes: string[]
  environment: 'prod' | 'dev' | 'staging'
  created_at: string
  last_used?: string
}

export interface CreateApiKeyRequest {
  name: string
  projectId?: string
  key_type?: 'public' | 'secret' | 'service_role' | 'mcp'
  environment?: 'prod' | 'dev' | 'staging'
  mcp_access_level?: 'ro' | 'rw' | 'admin'
}

export interface CreateApiKeyResponse {
  apiKey: {
    id: string
    name: string
    key_type: string
    key_prefix: string
    scopes: string[]
    environment: string
    public_key: string
    created_at: string
  }
  secretKey: string
  warning?: string
}

export interface RotateKeyResponse {
  apiKey: {
    id: string
    name: string
    key_type: string
    key_prefix: string
    scopes: string[]
    environment: string
    public_key: string
    created_at: string
  }
  secretKey: string
  message: string
  oldKeyId: string
  oldKeyExpiresAt: string
}

export interface RevokeKeyResponse {
  success: boolean
  message: string
  revokedKey?: {
    id: string
    name: string
    key_type: string
    key_prefix: string
    status: string
  }
}

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  user_role?: 'owner' | 'admin' | 'developer' | 'viewer'
  created_at: string
}

export interface CreateOrganizationRequest {
  name: string
  slug?: string
}

export interface CreateOrganizationResponse {
  success: boolean
  data: Organization
}

export interface ListOrganizationsResponse {
  success: boolean
  data: Organization[]
  meta?: {
    limit: number
    offset: number
  }
}

export interface ControlPlaneError {
  error: string
  message?: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Control Plane API configuration
 */
interface ControlPlaneConfig {
  baseUrl: string
}

/**
 * Control Plane API client
 */
export class ControlPlaneClient {
  private config: ControlPlaneConfig

  constructor(config: ControlPlaneConfig) {
    this.config = config
  }

  /**
   * Get the authorization token from the request headers
   * This allows the client to forward the user's JWT to the Control Plane API
   */
  private getAuthHeaders(req?: { headers: { get: (name: string) => string | null } }): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (req?.headers) {
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        headers['Authorization'] = authHeader
      }
    }

    return headers
  }

  /**
   * Make an authenticated request to the Control Plane API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      ...this.getAuthHeaders(req),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error: ControlPlaneError = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }))
        throw new ControlPlaneApiClientError(error.message || error.error, error)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ControlPlaneApiClientError) {
        throw error
      }
      throw new ControlPlaneApiClientError(
        'Failed to connect to Control Plane API',
        {
          error: 'NetworkError',
          message: error instanceof Error ? error.message : 'Unknown error',
        }
      )
    }
  }

  /**
   * Create a new project
   */
  async createProject(
    request: CreateProjectRequest,
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/api/v1/projects/${projectId}`, {}, req)
  }

  /**
   * Update a project
   */
  async updateProject(
    projectId: string,
    request: UpdateProjectRequest,
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ message: string; project: any }> {
    return this.request<{ message: string; project: any }>(`/api/v1/projects/${projectId}/restore`, {
      method: 'POST',
    }, req)
  }

  /**
   * List API keys for the authenticated user
   */
  async listApiKeys(
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ apiKeys: ApiKey[] }> {
    return this.request<{ apiKeys: ApiKey[] }>('/api/v1/keys', {}, req)
  }

  /**
   * Create a new API key
   */
  async createApiKey(
    request: CreateApiKeyRequest,
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<RevokeKeyResponse> {
    return this.request<RevokeKeyResponse>(`/api/v1/keys/${keyId}/revoke`, {
      method: 'DELETE',
    }, req)
  }

  /**
   * Get deletion preview for a project
   */
  async getDeletionPreview(
    projectId: string,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<DeletionPreviewResponse> {
    return this.request<DeletionPreviewResponse>(`/api/v1/projects/${projectId}/deletion-preview`, {}, req)
  }

  /**
   * Create a new organization
   */
  async createOrganization(
    request: CreateOrganizationRequest,
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; data: Organization; members?: any[] }> {
    return this.request<{ success: boolean; data: Organization; members?: any[] }>(`/api/v1/orgs/${orgId}`, {}, req)
  }

  /**
   * Update an organization
   */
  async updateOrganization(
    orgId: string,
    request: { name?: string },
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; data: any[] }> {
    return this.request<{ success: boolean; data: any[] }>(`/api/v1/orgs/${orgId}/members`, {}, req)
  }

  /**
   * Remove a member from an organization
   */
  async removeOrganizationMember(
    orgId: string,
    userId: string,
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; data: { org_id: string; user_id: string; role: string; joined_at: string } }> {
    return this.request<{ success: boolean; data: { org_id: string; user_id: string; role: string; joined_at: string } }>(`/api/v1/orgs/${orgId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List webhooks for a project or all webhooks for the authenticated user
   */
  async listWebhooks(
    query?: ListWebhooksQuery,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<ListWebhooksResponse> {
    const params = new URLSearchParams()
    if (query?.project_id) params.append('project_id', query.project_id)
    if (query?.event) params.append('event', query.event)
    if (query?.enabled !== undefined) params.append('enabled', query.enabled.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.offset) params.append('offset', query.offset.toString())
    const queryString = params.toString()
    const endpoint = `/api/v1/webhooks${queryString ? `?${queryString}` : ''}`
    return this.request<ListWebhooksResponse>(endpoint, {}, req)
  }

  /**
   * Get a single webhook by ID
   */
  async getWebhook(
    webhookId: string,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; data: Webhook }> {
    return this.request<{ success: boolean; data: Webhook }>(`/api/v1/webhooks/${webhookId}`, {}, req)
  }

  /**
   * Create a new webhook
   */
  async createWebhook(
    request: CreateWebhookRequest,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; data: CreateWebhookResponse }> {
    return this.request<{ success: boolean; data: CreateWebhookResponse }>('/api/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * Update a webhook
   */
  async updateWebhook(
    webhookId: string,
    request: UpdateWebhookRequest,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; data: Webhook }> {
    return this.request<{ success: boolean; data: Webhook }>(`/api/v1/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(
    webhookId: string,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
    }, req)
  }

  /**
   * Test a webhook by sending a test event
   */
  async testWebhook(
    request: TestWebhookRequest,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<TestWebhookResponse> {
    return this.request<TestWebhookResponse>('/api/v1/webhooks/test', {
      method: 'POST',
      body: JSON.stringify(request),
    }, req)
  }

  /**
   * List event logs (webhook delivery history)
   */
  async listEventLogs(
    query?: ListEventLogsQuery,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<ListEventLogsResponse> {
    const params = new URLSearchParams()
    if (query?.project_id) params.append('project_id', query.project_id)
    if (query?.webhook_id) params.append('webhook_id', query.webhook_id)
    if (query?.event_type) params.append('event_type', query.event_type)
    if (query?.status) params.append('status', query.status)
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.offset) params.append('offset', query.offset.toString())
    const queryString = params.toString()
    const endpoint = `/api/v1/webhooks/history${queryString ? `?${queryString}` : ''}`
    return this.request<ListEventLogsResponse>(endpoint, {}, req)
  }

  /**
   * Create a new secret
   */
  async createSecret(
    request: CreateSecretRequest,
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<GetSecretResponse> {
    return this.request<GetSecretResponse>(`/api/v1/secrets/${secretId}`, {}, req)
  }

  /**
   * Rotate a secret
   */
  async rotateSecret(
    secretId: string,
    request: RotateSecretRequest,
    req?: { headers: { get: (name: string) => string | null } }
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
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<ListSecretVersionsResponse> {
    return this.request<ListSecretVersionsResponse>(`/api/v1/secrets/${secretId}/versions`, {}, req)
  }

  /**
   * Delete a secret (soft delete)
   */
  async deleteSecret(
    secretId: string,
    req?: { headers: { get: (name: string) => string | null } }
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/secrets/${secretId}`, {
      method: 'DELETE',
    }, req)
  }
}

/**
 * Custom error class for Control Plane API client errors
 */
export class ControlPlaneApiClientError extends Error {
  public readonly code?: string
  public readonly details?: Record<string, unknown>

  constructor(message: string, errorResponse: ControlPlaneError) {
    super(message)
    this.name = 'ControlPlaneApiClientError'
    this.code = errorResponse.code
    this.details = errorResponse.details
  }
}

/**
 * Create a Control Plane API client instance
 * Reads configuration from environment variables
 */
export function createControlPlaneClient(): ControlPlaneClient {
  const baseUrl = process.env.CONTROL_PLANE_URL || 'http://localhost:3000'
  return new ControlPlaneClient({ baseUrl })
}

/**
 * Get the Control Plane API client instance
 */
export function getControlPlaneClient(): ControlPlaneClient {
  if (!controlPlaneClient) {
    controlPlaneClient = createControlPlaneClient()
  }
  return controlPlaneClient
}

/**
 * Default Control Plane API client instance
 */
let controlPlaneClient: ControlPlaneClient | undefined = undefined

// Initialize the client on module load
try {
  controlPlaneClient = createControlPlaneClient()
} catch (error) {
  // Client will be undefined, can be initialized later
  console.warn('[Control Plane Client] Failed to initialize:', error)
}
