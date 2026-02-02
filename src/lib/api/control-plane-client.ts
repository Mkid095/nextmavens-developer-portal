/**
 * Control Plane API Client
 * Client for interacting with the Control Plane API for projects, API keys, and governance operations
 */

import type {
  ControlPlaneConfig,
  RequestHeaders,
} from './control-plane-client/types'
import type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RotateKeyResponse,
  RevokeKeyResponse,
  Organization,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  ListOrganizationsResponse,
  ControlPlaneError,
} from './control-plane-client/types'
import type { DeletionPreviewResponse } from '@/lib/types/deletion-preview.types'
import type {
  Webhook,
  CreateWebhookRequest,
  CreateWebhookResponse,
  UpdateWebhookRequest,
  ListWebhooksQuery,
  ListWebhooksResponse,
  TestWebhookRequest,
  TestWebhookResponse,
  ListEventLogsQuery,
  ListEventLogsResponse,
} from '@/lib/types/webhook.types'
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
import { ProjectsApi } from './control-plane-client/projects'
import { ApiKeysApi } from './control-plane-client/api-keys'
import { OrganizationsApi } from './control-plane-client/organizations'
import { WebhooksApi } from './control-plane-client/webhooks'
import { SecretsApi } from './control-plane-client/secrets'
import { ControlPlaneApiClientError } from './control-plane-client/base-client'

/**
 * Control Plane API client
 * Combines all API modules into a single client
 */
function applyMixins(target: any, ...baseClasses: any[]) {
  baseClasses.forEach(baseClass => {
    Object.getOwnPropertyNames(baseClass.prototype).forEach(name => {
      if (name !== 'constructor') {
        target[name] = baseClass.prototype[name]
      }
    })
  })
}

// Create the combined client class
class CombinedControlPlaneClient extends ProjectsApi {}
applyMixins(CombinedControlPlaneClient, ApiKeysApi, OrganizationsApi, WebhooksApi, SecretsApi)

/**
 * Control Plane API client
 * Use this class to interact with all Control Plane API endpoints
 */
export class ControlPlaneClient extends CombinedControlPlaneClient {
  constructor(config: ControlPlaneConfig) {
    super(config)
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

// Re-export types
export type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RotateKeyResponse,
  RevokeKeyResponse,
  Organization,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  ListOrganizationsResponse,
  ControlPlaneError,
  ControlPlaneConfig,
  RequestHeaders,
}
export { ControlPlaneApiClientError }
