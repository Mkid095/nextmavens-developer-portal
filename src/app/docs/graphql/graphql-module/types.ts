/**
 * GraphQL Docs Module - Types
 */

/**
 * GraphQL configuration
 */
export interface GraphQLConfig {
  domain: string
  port: number
  graphiqlUrl: string | null
  features: string[]
}

/**
 * Query example with variables
 */
export interface QueryExample {
  title: string
  code: string
  variables?: Record<string, unknown>
}

/**
 * Connection argument definition
 */
export interface ConnectionArg {
  name: string
  type: string
  description: string
}
