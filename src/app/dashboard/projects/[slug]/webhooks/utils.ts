/**
 * Webhooks Page Utilities
 * Helper functions for the webhooks page
 */

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || null
  }
  return null
}

export function createAuthHeaders() {
  const token = getAuthToken()
  return {
    headers: {
      get: (name: string) => (name === 'authorization' ? token || '' : null),
    },
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}
