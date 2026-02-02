/**
 * Dashboard Page Utilities
 * Helper functions and utilities for the dashboard page
 */

export interface ApiKey {
  id: string
  name: string
  public_key: string
  created_at: string
  key_type?: string
  key_prefix?: string
  environment?: string
}

export interface Project {
  id: string
  name: string
  slug: string
  created_at: string
  status?: string
  environment?: 'prod' | 'dev' | 'staging'
  deleted_at?: string | null
  deletion_scheduled_at?: string | null
  grace_period_ends_at?: string | null
  recoverable_until?: string | null
}

export interface Developer {
  id: string
  email: string
  name: string
  organization?: string
}

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export const environmentMap: Record<string, 'prod' | 'dev' | 'staging'> = {
  'live': 'prod',
  'test': 'staging',
  'dev': 'dev',
}

export const handleCopyToClipboard = async (text: string, onCopied?: (id: string) => void) => {
  await navigator.clipboard.writeText(text)
  if (onCopied) {
    onCopied(text)
  }
}
