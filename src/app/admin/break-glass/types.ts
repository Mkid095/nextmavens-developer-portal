/**
 * Break Glass Page Types
 * Type definitions for emergency admin access console
 */

export interface BreakGlassSession {
  success: boolean
  session_token: string
  session_id: string
  expires_at: string
  expires_in_seconds: number
  admin_id: string
  created_at: string
}

export interface BreakGlassError {
  success: false
  error: string
  code: string
  details?: string
}

export interface Power {
  id: string
  name: string
  description: string
  warning: string
  icon: React.ElementType
  endpoint: string
  method: 'POST' | 'DELETE' | 'GET'
  color: string
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export type AccessMethod = 'hardware_key' | 'otp' | 'emergency_code'
