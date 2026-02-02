/**
 * Notification Queue/Processing System
 *
 * Manages the queue of pending notifications and processes them asynchronously.
 * Provides retry logic, failure handling, and delivery tracking.
 *
 * REFACTORED: This file has been refactored into a modular structure.
 * All functionality is preserved while keeping each module under 300 lines.
 *
 * The new structure is:
 * - notification-queue/queue-operations.ts - Database operations
 * - notification-queue/worker.ts - Core processing logic
 * - notification-queue/retry.ts - Retry and failure handling
 * - notification-queue/utils.ts - Utility functions
 * - notification-queue/index.ts - Main exports
 *
 * This file now re-exports everything from the new modular structure
 * for backward compatibility with existing imports.
 */

// Export everything from the new modular structure
export * from './notification-queue'

// Note: This file is kept for backward compatibility.
// New code should import directly from './notification-queue':
// import { processNotification, getQueueStatistics } from './notification-queue'
