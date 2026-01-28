/**
 * Error Rate Detection Demo
 *
 * This file demonstrates how to use the error rate detection system.
 * It shows how to record error metrics and run detection checks.
 */

import {
  recordErrorMetrics,
  runErrorRateDetection,
  checkProjectErrorRateStatus,
  getErrorRateDetectionConfig,
  calculateErrorRate,
} from './error-rate-detection'

/**
 * Example 1: Record error metrics for a project
 *
 * This should be called periodically (e.g., every minute) to track
 * error rates over time.
 */
export async function exampleRecordErrorMetrics() {
  const projectId = 'your-project-id'

  // Record metrics: 1000 requests, 150 errors (15% error rate)
  await recordErrorMetrics(projectId, 1000, 150)

  console.log(`Recorded error metrics for project ${projectId}`)
}

/**
 * Example 2: Run error rate detection for all projects
 *
 * This should be called from a background job/cron (e.g., every hour).
 */
export async function exampleRunErrorRateDetection() {
  const result = await runErrorRateDetection()

  console.log(`Error rate detection completed:`)
  console.log(`- Projects checked: ${result.projectsChecked}`)
  console.log(`- High error rates detected: ${result.errorRatesDetected}`)
  console.log(`- Warnings: ${result.actionsTaken.warnings}`)
  console.log(`- Investigations: ${result.actionsTaken.investigations}`)

  if (result.detectedErrorRates.length > 0) {
    console.log('\nDetected high error rates:')
    result.detectedErrorRates.forEach((detection) => {
      console.log(
        `- Project ${detection.projectId}: ${detection.errorRate}% (${detection.severity.toUpperCase()})`
      )
    })
  }
}

/**
 * Example 3: Check a specific project for high error rates
 */
export async function exampleCheckProjectErrorRate() {
  const projectId = 'your-project-id'

  const result = await checkProjectErrorRateStatus(projectId)

  if (result && result.errorRateDetected) {
    console.log(`High error rate detected for project ${projectId}:`)
    console.log(`- Error rate: ${result.errorRate}%`)
    console.log(`- Severity: ${result.severity}`)
    console.log(`- Recommended action: ${result.recommendedAction}`)
    console.log(`- Details: ${result.details}`)
  } else {
    console.log(`No high error rate detected for project ${projectId}`)
  }
}

/**
 * Example 4: Get current error rate detection configuration
 */
export async function exampleGetConfig() {
  const config = getErrorRateDetectionConfig()

  console.log('Error rate detection configuration:')
  console.log(`- Threshold: ${config.thresholdPercentage}%`)
  console.log(`- Detection window: ${config.detectionWindowMs}ms`)
  console.log(`- Minimum requests: ${config.minRequestsForDetection}`)
  console.log(`- Action thresholds:`)
  config.actionThresholds.forEach((threshold) => {
    console.log(`  - ${threshold.minErrorRate}%+: ${threshold.action}`)
  })
}

/**
 * Example 5: Simulate a DDoS attack scenario
 *
 * This demonstrates how the system would detect a sudden spike in error rates
 * that could indicate a DDoS attack or abuse.
 */
export async function exampleSimulateDdosAttack() {
  const projectId = 'test-project-id'

  // Simulate normal traffic for an hour
  for (let i = 0; i < 60; i++) {
    // Normal traffic: 100 requests, 5 errors (5% error rate)
    await recordErrorMetrics(projectId, 100, 5)
  }

  // Simulate DDoS attack: massive spike in requests and errors
  for (let i = 0; i < 10; i++) {
    // Attack traffic: 10000 requests, 8000 errors (80% error rate)
    await recordErrorMetrics(projectId, 10000, 8000)
  }

  // Run error rate detection
  const result = await checkProjectErrorRateStatus(projectId)

  if (result && result.errorRateDetected) {
    console.log(`DDoS attack detected for project ${projectId}!`)
    console.log(`- Error rate: ${result.errorRate}%`)
    console.log(`- Severity: ${result.severity}`)
    console.log(`- Recommended action: ${result.recommendedAction}`)
    console.log(`- Total requests: ${result.totalRequests}`)
    console.log(`- Error count: ${result.errorCount}`)
  }
}

/**
 * Example 6: Calculate error rate for a time period
 */
export async function exampleCalculateErrorRate() {
  const projectId = 'your-project-id'

  const startTime = new Date()
  startTime.setHours(startTime.getHours() - 1) // 1 hour ago

  const endTime = new Date()

  const errorRate = await calculateErrorRate(projectId, startTime, endTime)

  console.log(`Error rate for project ${projectId} in the last hour: ${errorRate}%`)
}

/**
 * Example integration with an API endpoint
 *
 * This shows how to integrate error rate detection with your API
 * to automatically track errors.
 */
export async function exampleApiIntegration() {
  const projectId = 'your-project-id'

  try {
    // Simulate API request processing
    const requestCount = 100
    let errorCount = 0

    // Process requests...
    for (let i = 0; i < requestCount; i++) {
      try {
        // Simulate some requests failing
        if (Math.random() < 0.1) {
          // 10% chance of error
          throw new Error('Simulated error')
        }
        // Process request successfully
      } catch (error) {
        errorCount++
      }
    }

    // Record metrics
    await recordErrorMetrics(projectId, requestCount, errorCount)

    console.log(`Processed ${requestCount} requests with ${errorCount} errors`)
  } catch (error) {
    console.error('Error processing requests:', error)
  }
}
