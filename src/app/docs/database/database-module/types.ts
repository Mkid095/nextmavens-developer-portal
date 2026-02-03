/**
 * Database Docs Module - Types
 */

/**
 * Database configuration
 */
export interface DatabaseConfig {
  domain: string
  port: number
  features: string[]
}

/**
 * API endpoint example
 */
export interface EndpointExample {
  url: string
  description: string
}

/**
 * API endpoint definition
 */
export interface Endpoint {
  name: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  path: string
  description: string
  examples: EndpointExample[]
}

/**
 * Filter operator definition
 */
export interface FilterOperator {
  operator: string
  description: string
  example: string
}

/**
 * Method color mapping
 */
export interface MethodColorConfig {
  method: string
  bgColor: string
  textColor: string
}
