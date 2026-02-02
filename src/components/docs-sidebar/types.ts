/**
 * Docs Sidebar Types
 */

export interface SidebarSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  path: string
  children?: {
    title: string
    path: string
  }[]
}

export interface DocsSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}
