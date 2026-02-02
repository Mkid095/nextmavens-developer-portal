/**
 * Pattern Checker Module
 * Functions for checking projects for malicious patterns
 */

import { getPool } from '@/lib/db'
import type { PatternDetectionResult } from '../../types'
import { detectSQLInjectionForProject } from './sql-injection-detector'
import { detectAuthBruteForceForProject } from './auth-brute-force-detector'
import { detectRapidKeyCreationForProject } from './rapid-key-creation-detector'

/**
 * Check a single project for all malicious patterns
 *
 * @param projectId - The project to check
 * @returns Array of pattern detection results
 */
export async function checkProjectForMaliciousPatterns(
  projectId: string
): Promise<PatternDetectionResult[]> {
  const detectedPatterns: PatternDetectionResult[] = []

  try {
    // Check for SQL injection patterns
    const sqlInjectionResult = await detectSQLInjectionForProject(projectId)
    if (sqlInjectionResult) {
      detectedPatterns.push(sqlInjectionResult)
      console.log(
        `[Pattern Detection] SQL injection detected for project ${projectId}: ` +
        `${sqlInjectionResult.occurrence_count} occurrence(s) - ` +
        `Severity: ${sqlInjectionResult.severity.toUpperCase()}`
      )
    }

    // Check for auth brute force patterns
    const bruteForceResult = await detectAuthBruteForceForProject(projectId)
    if (bruteForceResult) {
      detectedPatterns.push(bruteForceResult)
      console.log(
        `[Pattern Detection] Auth brute force detected for project ${projectId}: ` +
        `${bruteForceResult.occurrence_count} failed attempt(s) - ` +
        `Severity: ${bruteForceResult.severity.toUpperCase()}`
      )
    }

    // Check for rapid key creation patterns
    const rapidKeyCreationResult = await detectRapidKeyCreationForProject(projectId)
    if (rapidKeyCreationResult) {
      detectedPatterns.push(rapidKeyCreationResult)
      console.log(
        `[Pattern Detection] Rapid key creation detected for project ${projectId}: ` +
        `${rapidKeyCreationResult.occurrence_count} key(s) created - ` +
        `Severity: ${rapidKeyCreationResult.severity.toUpperCase()}`
      )
    }

    return detectedPatterns
  } catch (error) {
    console.error(`[Pattern Detection] Error checking project ${projectId}:`, error)
    return []
  }
}

/**
 * Check all projects for malicious patterns
 *
 * This function is designed to be called by a background job/cron.
 * It iterates through all active projects and checks for malicious patterns.
 *
 * @returns Array of all detected patterns
 */
export async function checkAllProjectsForMaliciousPatterns(): Promise<PatternDetectionResult[]> {
  const pool = getPool()

  try {
    console.log('[Pattern Detection] Starting malicious pattern check for all projects')

    // Get all active projects
    const projectsResult = await pool.query(
      `
      SELECT id, project_name
      FROM projects
      WHERE status = 'active'
      `
    )

    const projects = projectsResult.rows
    console.log(`[Pattern Detection] Checking ${projects.length} active projects`)

    const allDetectedPatterns: PatternDetectionResult[] = []

    // Check each project for malicious patterns
    for (const project of projects) {
      const projectId = project.id

      try {
        const patterns = await checkProjectForMaliciousPatterns(projectId)
        allDetectedPatterns.push(...patterns)
      } catch (error) {
        console.error(
          `[Pattern Detection] Error checking project ${projectId}:`,
          error
        )
        // Continue with next project
      }
    }

    console.log(
      `[Pattern Detection] Pattern detection complete. ${allDetectedPatterns.length} malicious pattern(s) detected.`
    )

    return allDetectedPatterns
  } catch (error) {
    console.error('[Pattern Detection] Error checking all projects for malicious patterns:', error)
    throw new Error('Failed to check projects for malicious patterns')
  }
}
