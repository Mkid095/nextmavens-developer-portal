/**
 * Incident Route Module - Types
 */

import type { NextRequest } from 'next/server'
import type { Developer } from '@/lib/auth'

/**
 * Request body for updating an incident
 */
export interface UpdateIncidentBody {
  status?: 'active' | 'resolved' | 'maintenance'
  title?: string
  description?: string
  impact?: 'high' | 'medium' | 'low'
  resolved_at?: string | null
}

/**
 * Incident record from database
 */
export interface IncidentRecord {
  id: string
  service: string
  status: string
  title: string
  description: string
  impact: string
  started_at: Date
  resolved_at: Date | null
  affected_services: string[]
  created_at: Date
}

/**
 * Incident update record from database
 */
export interface IncidentUpdateRecord {
  id: string
  message: string
  status: string
  created_at: Date
}

/**
 * Incident response with updates
 */
export interface IncidentWithUpdates extends IncidentRecord {
  updates: IncidentUpdateRecord[]
}

/**
 * API response type
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: string
}

/**
 * Authentication context
 */
export interface AuthContext {
  developer: Developer
  isAuthenticated: boolean
}

/**
 * Route parameters
 */
export interface RouteParams {
  id: string
}
