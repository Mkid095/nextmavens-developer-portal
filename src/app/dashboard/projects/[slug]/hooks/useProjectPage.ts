/**
 * Project Page Hook
 * @deprecated This file has been refactored into a module. Please import from './use-project-page-module' instead.
 * All functionality is now organized in separate files for better maintainability.
 */

'use client'

// Re-export everything from the module for backward compatibility
export * from './use-project-page-module'

// Re-export the default hook for backward compatibility
export { useProjectPage } from './use-project-page-module'

/**
 * @deprecated Use `useProjectPage` from './use-project-page-module' instead.
 * This re-export is maintained for backward compatibility only.
 */
