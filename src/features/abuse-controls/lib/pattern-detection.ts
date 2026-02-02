/**
 * Malicious Pattern Detection Library
 *
 * Detects sophisticated abuse patterns including:
 * - SQL injection attempts
 * - Authentication brute force attacks
 * - Rapid sequential API key creation
 *
 * Usage:
 * - Call runPatternDetection() from a background job (e.g., every hour)
 * - The function will check all projects for malicious patterns
 * - Actions are taken based on pattern severity (warning or suspension)
 *
 * This module has been refactored into smaller, focused modules:
 * - pattern-detection/sql-injection-detector.ts - SQL injection detection
 * - pattern-detection/auth-brute-force-detector.ts - Auth brute force detection
 * - pattern-detection/rapid-key-creation-detector.ts - Rapid key creation detection
 * - pattern-detection/pattern-checker.ts - Pattern checking functions
 * - pattern-detection/pattern-processor.ts - Pattern processing and actions
 * - pattern-detection/pattern-detection-job.ts - Main background job
 * - pattern-detection/pattern-status.ts - Status and summary functions
 */

// Re-export all pattern detection functions from submodules
export {
  detectSQLInjection,
  analyzeSQLInjectionPatterns,
  detectSQLInjectionForProject,
  analyzeAuthBruteForcePatterns,
  detectAuthBruteForceForProject,
  analyzeRapidKeyCreationPatterns,
  detectRapidKeyCreationForProject,
  checkProjectForMaliciousPatterns,
  checkAllProjectsForMaliciousPatterns,
  triggerSuspensionForPattern,
  processPatternDetections,
  runPatternDetection,
  getPatternDetectionConfig,
  checkProjectPatternStatus,
  getPatternDetectionSummary,
} from './pattern-detection/index'
