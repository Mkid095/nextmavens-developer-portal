/**
 * Verify Notification Integration - Main Verification Module
 *
 * Comprehensive verification that the suspension notification system
 * is properly integrated and all components are working together.
 */

import * as checks from './checks'
import type { VerificationResult, VerificationReport } from './types'

/**
 * Run all verification checks
 */
export async function verifyNotificationIntegration(): Promise<VerificationReport> {
  const checksResults: VerificationResult[] = []

  console.log('\n========================================')
  console.log('Notification Integration Verification')
  console.log('========================================\n')

  // Run all checks
  checksResults.push(await checks.verifyDatabaseTables())
  checksResults.push(await checks.verifyTypeExports())
  checksResults.push(await checks.verifyNotificationFunctions())
  checksResults.push(await checks.verifyEmailService())
  checksResults.push(await checks.verifySuspensionIntegration())
  checksResults.push(await checks.verifyNotificationPreferences())
  checksResults.push(await checks.verifyEmailTemplates())

  // Calculate results
  const passed = checksResults.filter((c) => c.passed).length
  const failed = checksResults.filter((c) => !c.passed).length
  const success = failed === 0

  const summary = `
========================================
Verification Summary
========================================
Total Checks: ${checksResults.length}
Passed: ${passed}
Failed: ${failed}
Status: ${success ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'}
========================================\n`

  console.log(summary)

  for (const check of checksResults) {
    const status = check.passed ? '✓' : '✗'
    console.log(`${status} ${check.name}`)
    if (!check.passed) {
      console.log(`  ${check.message}`)
      if (check.details) {
        console.log(`  Details: ${JSON.stringify(check.details, null, 2)}`)
      }
    }
  }

  console.log('')

  return { success, checks: checksResults, summary }
}

/**
 * Main verification function for CLI execution
 */
export async function main(): Promise<void> {
  try {
    const result = await verifyNotificationIntegration()

    if (result.success) {
      console.log('\n✓ Notification system is fully integrated and ready to use!\n')
      process.exit(0)
    } else {
      console.log('\n✗ Notification system has integration issues that need to be addressed.\n')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n✗ Fatal error during verification:', error)
    process.exit(1)
  }
}

export * from './types'
export * from './checks'

// Run verification if this file is executed directly
if (require.main === module) {
  main()
}
