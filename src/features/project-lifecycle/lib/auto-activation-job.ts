/**
 * Auto-Activation Background Job
 *
 * PRD: US-010 - Implement Auto-Status Transitions
 *
 * @deprecated This file has been refactored into the auto-activation-job-module.
 * Please import from './auto-activation-job-module' instead.
 * All functionality is now organized in separate files for better maintainability.
 *
 * This module provides the background job for automatically activating projects
 * after provisioning completes.
 *
 * Transitions: CREATED → ACTIVE after all provisioning steps succeed
 *
 * Usage:
 * - Call runAutoActivationJob() from a cron job (recommended: every 5 minutes)
 * - The function will find all CREATED projects with complete provisioning
 * - It will automatically transition them to ACTIVE status
 */

// Re-export everything from the module for backward compatibility
export * from './auto-activation-job-module'
