/**
 * Authentication Documentation - Module - Types
 */

export interface HttpMethod {
  GET: string
  POST: string
}

export interface AuthConfig {
  domain: string
  port: number
  jwtSecret: string
  accessTokenExpiry: string
  refreshTokenExpiry: string
}

export interface EndpointRequest {
  [key: string]: string
}

export interface EndpointResponse {
  [key: string]: string
}

export interface Endpoint {
  name: string
  method: keyof HttpMethod | 'GET' | 'POST'
  path: string
  gatewayPath: string
  description: string
  request?: EndpointRequest
  headers?: Record<string, string>
  response: EndpointResponse
}

export interface JwtPayload {
  userId: string
  email: string
  tenantId: string
  role: string
  iat: string
  exp: string
}

export interface JwtStructure {
  header: string
  payload: JwtPayload
}

export interface SecurityPractice {
  title: string
  description: string
}
