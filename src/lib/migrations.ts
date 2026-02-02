/**
 * Database migrations module (legacy entry point)
 *
 * This file re-exports from the modular migrations directory for backward compatibility.
 * New code should import directly from @lib/migrations instead.
 *
 * @deprecated Import from '@lib/migrations' instead
 */

// Re-export everything from the migrations module
export * from './migrations'
