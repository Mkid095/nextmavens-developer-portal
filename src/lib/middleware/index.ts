/**
 * Middleware Central Export
 *
 * Central export point for all middleware functionality.
 *
 * US-002: Implement Correlation ID Middleware
 * US-002: Scope Database Queries (prd-resource-isolation.json)
 * US-003: Prefix Realtime Channels (prd-resource-isolation.json)
 * US-004: Prefix Storage Paths (prd-resource-isolation.json)
 * US-011: Implement Request Tracing
 */

export {
  generateCorrelationId,
  extractCorrelationId,
  withCorrelationId,
  setCorrelationHeader,
  correlationMiddleware,
  getCorrelationId,
  withCorrelation,
  CORRELATION_HEADER,
} from './correlation';

/**
 * Request Tracing Middleware
 *
 * US-011: Implement Request Tracing
 * - Logs request start/end with timing
 * - Tracks services hit during request
 * - Updates request_traces table
 */
export {
  withRequestTracing,
  withRequestTracingEnhanced,
  logServiceHitForRequest,
} from './request-tracing';

export {
  withSchemaScope,
  getScopedClient,
  withSchemaScopeHandler,
  validateQueryIsolation,
  clearTenantSlugCache,
  SchemaScopeError,
  type ScopedPool,
  type ScopedClient,
} from './schema-scope';

export {
  validateChannelFormat,
  validateChannelSubscription,
  buildChannelName,
  extractProjectIdFromChannel,
  isSystemChannel,
  validateRealtimeConnection,
  createRealtimeHandshake,
  handleChannelSubscription,
  generateAllowedChannels,
  addSubscription,
  removeSubscription,
  getProjectSubscriptions,
  clearProjectSubscriptions,
  RealtimeScopeError,
  ChannelType,
  type RealtimeSubscription,
} from './realtime-scope';

export {
  validateStoragePathFormat,
  validateStoragePath,
  buildStoragePath,
  extractProjectIdFromPath,
  extractStoragePath,
  handleFileUpload,
  handleFileDownload,
  isSystemPath,
  generateExamplePaths,
  createStorageFile,
  StorageScopeError,
  type StorageFile,
} from './storage-scope';

/**
 * MCP Scope Enforcement
 *
 * US-007: Implement MCP Scope Enforcement
 * - Gateway checks key type and scopes
 * - MCP tokens limited to their scopes
 * - Read-only tokens rejected for write operations
 * - Returns PERMISSION_DENIED with clear message
 */
export {
  // MCP scope enforcement utilities
  enforceMcpScope,
  gatewayMcpScopeEnforcement,
  validateMcpScopes,
  getMcpAccessLevel,
  isMcpReadOnly,
  isMcpToken,
  mcpHasWriteAccess,
  mcpHasAdminAccess,
  requiresWriteAccess,
  requiresAdminAccess,
  getAllowedOperationsForMcpLevel,
  createMcpPermissionDeniedError,
  // Types
  type McpScopeErrorResponse,
} from '../mcp-scope-enforcement';

/**
 * Scope Enforcement (base utilities)
 *
 * US-007: Core scope enforcement functions
 */
export {
  enforceScope,
  enforceScopeWithMcpRestrictions,
  gatewayScopeEnforcement,
  gatewayMcpScopeEnforcement as gatewayScopeEnforcementWithMcp,
  hasRequiredScope,
  hasAllRequiredScopes,
  hasAnyRequiredScope,
  hasServiceScope,
  isMcpToken as isMcpTokenBase,
  isMcpReadOnlyToken,
  isWriteOperation,
  logScopeCheck,
  getMissingScopes,
  // Types and constants
  ScopeErrorType,
  type ScopeErrorResponse,
  REQUIRED_SCOPES,
} from '../scope-enforcement';

/**
 * API Key Authentication with Scope Enforcement
 *
 * US-007: Implement MCP Scope Enforcement
 * Middleware for authenticating API keys and enforcing scopes at gateway level
 */
export {
  authenticateApiKeyWithScope,
  enforceScopeForApiKey,
  createScopeErrorResponse,
  extractApiKey,
  withApiKeyScope,
  withApiKeyAuth,
  type AuthenticatedApiKey,
} from './api-key-auth';
