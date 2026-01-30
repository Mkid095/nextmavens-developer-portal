/**
 * Correlation ID Middleware
 *
 * Central export point for correlation ID functionality.
 *
 * US-002: Implement Correlation ID Middleware
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
