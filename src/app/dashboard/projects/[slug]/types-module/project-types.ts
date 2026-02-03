/**
 * Project Types Module - Project & API Key Types
 */

/**
 * Project interface
 */
export interface Project {
  id: string
  name: string
  slug: string
  tenant_id: string
  created_at: string
  status?: string
  environment?: 'prod' | 'dev' | 'staging'
}

/**
 * API Key interface
 */
export interface ApiKey {
  id: string
  name: string
  key_type: string
  key_prefix: string
  public_key: string
  created_at: string
  status?: string
  expires_at?: string
  last_used?: string
  usage_count?: number
}

/**
 * New key response with optional secret key
 */
export interface NewKeyResponse {
  apiKey: ApiKey
  secretKey?: string
}

/**
 * Key usage statistics (US-005)
 */
export interface KeyUsageStats {
  keyId: string
  usageCount: number
  lastUsed: string | null
  createdAt: string
  usageByTimePeriod: {
    last7Days: number
    last30Days: number
  }
  successErrorRate: {
    total: number
    success: number
    error: number
    successRate: number
    errorRate: number
  }
}
