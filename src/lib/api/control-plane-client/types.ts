/**
 * Control Plane API Client Types
 * Type definitions for Control Plane API requests and responses
 */

// Project types
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

// API Key types
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

// Organization types
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

// Error types
export interface ControlPlaneError {
  error: string
  message?: string
  code?: string
  details?: Record<string, unknown>
}

// Client configuration
export interface ControlPlaneConfig {
  baseUrl: string
}

// Request headers type
export type RequestHeaders = {
  headers: { get: (name: string) => string | null }
}
