/**
 * Database Documentation - Module - Types
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface EndpointExample {
  url: string
  description: string
}

export interface Endpoint {
  name: string
  method: HttpMethod
  path: string
  description: string
  examples: EndpointExample[]
}

export interface FilterOperator {
  operator: string
  description: string
  example: string
}

export interface CodeExample {
  title: string
  code: string
}
