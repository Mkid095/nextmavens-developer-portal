/**
 * API Gateway Snapshot Client
 */

export {
  apiGatewaySnapshotClient,
  validateGatewayRequest,
  isGatewayProjectActive,
  isGatewayServiceEnabled,
  checkGatewayRateLimit,
  invalidateGatewaySnapshotCache,
  clearGatewaySnapshotCache,
  getGatewaySnapshotCacheStats,
  cleanupExpiredGatewayCacheEntries,
  cleanupRateLimitTrackingData,
  type GatewayService,
  type RateLimitCheckResult,
} from './snapshot-client/convenience'

if (typeof setInterval !== 'undefined') {
  const { cleanupExpiredGatewayCacheEntries, cleanupRateLimitTrackingData } = require('./snapshot-client/convenience')
  setInterval(() => {
    cleanupExpiredGatewayCacheEntries()
    cleanupRateLimitTrackingData()
  }, 5 * 60 * 1000)
}
