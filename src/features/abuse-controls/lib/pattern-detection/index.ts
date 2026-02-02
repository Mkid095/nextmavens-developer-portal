/**
 * Pattern Detection Library
 * Re-exports all pattern detection modules
 */

// SQL Injection Detection
export { detectSQLInjection, analyzeSQLInjectionPatterns, detectSQLInjectionForProject } from './sql-injection-detector'

// Auth Brute Force Detection
export { analyzeAuthBruteForcePatterns, detectAuthBruteForceForProject } from './auth-brute-force-detector'

// Rapid Key Creation Detection
export { analyzeRapidKeyCreationPatterns, detectRapidKeyCreationForProject } from './rapid-key-creation-detector'

// Pattern Checking
export { checkProjectForMaliciousPatterns, checkAllProjectsForMaliciousPatterns } from './pattern-checker'

// Pattern Processing
export { triggerSuspensionForPattern, processPatternDetections } from './pattern-processor'

// Pattern Detection Job
export { runPatternDetection } from './pattern-detection-job'

// Status and Configuration
export { getPatternDetectionConfig, checkProjectPatternStatus, getPatternDetectionSummary } from './pattern-status'
