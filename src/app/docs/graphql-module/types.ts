/**
 * GraphQL Documentation - Module - Types
 */

export interface ConnectionArg {
  name: string
  type: string
  description: string
}

export interface QueryExample {
  title: string
  code: string
  variables?: Record<string, unknown>
}

export interface CodeExample {
  title: string
  description?: string
  code: string
}
