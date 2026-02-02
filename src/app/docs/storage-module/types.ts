/**
 * Storage Documentation - Type Definitions
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface StorageConfig {
  domain: string
  port: number
  features: string[]
  maxFileSize: string
}

export interface Endpoint {
  name: string
  method: HttpMethod
  path: string
  description: string
  contentType?: string
  request?: Record<string, string>
  headers?: Record<string, string>
  queryParams?: Record<string, string>
  response: Record<string, string> | string
}

export interface SupportedFormat {
  category: string
  formats: string[]
}

export interface CodeExample {
  title: string
  code: string
}
