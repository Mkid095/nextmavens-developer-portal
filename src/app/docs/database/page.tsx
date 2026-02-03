/**
 * Database Documentation Page
 * @deprecated This file has been refactored into the database-module.
 * Please import from './database-module' instead.
 * All documentation content is now organized in separate files for better maintainability.
 */

'use client'

// Re-export the main view component from the module for backward compatibility
export { default as DatabaseDocsView } from './database-module/DatabaseDocsView'

// Re-export everything from the module for backward compatibility
export * from './database-module'

/**
 * Default export - main database documentation page component
 */
export { default } from './database-module/DatabaseDocsView'
