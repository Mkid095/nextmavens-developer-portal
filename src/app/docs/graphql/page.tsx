/**
 * GraphQL Documentation Page
 * @deprecated This file has been refactored into the graphql-module.
 * Please import from './graphql-module' instead.
 * All documentation content is now organized in separate files for better maintainability.
 */

'use client'

// Re-export the main view component from the module for backward compatibility
export { default as GraphQLDocsView } from './graphql-module/GraphQLDocsView'

// Re-export everything from the module for backward compatibility
export * from './graphql-module'

/**
 * Default export - main GraphQL documentation page component
 */
export { default } from './graphql-module/GraphQLDocsView'
