/**
 * Docs Sidebar Utilities
 */

// Helper to detect Mac OS
export function isMac(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

export function isActivePath(path: string, pathname: string): boolean {
  if (path === '/docs') {
    return pathname === '/docs'
  }
  return pathname.startsWith(path)
}
