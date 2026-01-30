'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { BookOpen, Database, Shield, HardDrive, Globe, DatabaseBackup, ChevronRight, ChevronLeft, Code, Zap, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Helper to detect Mac OS
const isMac = (): boolean => {
  if (typeof window === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

interface SidebarSection {
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

const sidebarSections: SidebarSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    color: 'emerald',
    path: '/docs',
    children: [
      { title: 'Introduction', path: '/docs' },
      { title: 'Platform Philosophy', path: '/docs/platform-philosophy' },
    ],
  },
  {
    id: 'database',
    title: 'Database',
    icon: Database,
    color: 'blue',
    path: '/docs/database',
    children: [
      { title: 'Overview', path: '/docs/database' },
      { title: 'Limits & Quotas', path: '/docs/database/limits' },
    ],
  },
  {
    id: 'authentication',
    title: 'Authentication',
    icon: Shield,
    color: 'purple',
    path: '/docs/auth',
    children: [
      { title: 'Overview', path: '/docs/auth' },
    ],
  },
  {
    id: 'realtime',
    title: 'Realtime',
    icon: Zap,
    color: 'orange',
    path: '/docs/realtime',
    children: [
      { title: 'Overview', path: '/docs/realtime' },
    ],
  },
  {
    id: 'storage',
    title: 'Storage',
    icon: HardDrive,
    color: 'orange',
    path: '/docs/storage',
    children: [
      { title: 'Overview', path: '/docs/storage' },
    ],
  },
  {
    id: 'graphql',
    title: 'GraphQL',
    icon: Globe,
    color: 'emerald',
    path: '/docs/graphql',
    children: [
      { title: 'Overview', path: '/docs/graphql' },
    ],
  },
  {
    id: 'sdk',
    title: 'SDK',
    icon: Code,
    color: 'slate',
    path: '/docs/sdk',
    children: [
      { title: 'Overview', path: '/docs/sdk' },
    ],
  },
  {
    id: 'mcp-integration',
    title: 'MCP Integration',
    icon: Globe,
    color: 'teal',
    path: '/mcp',
    children: [
      { title: 'Overview', path: '/mcp' },
    ],
  },
  {
    id: 'backups',
    title: 'Backup Strategy',
    icon: DatabaseBackup,
    color: 'blue',
    path: '/docs/backups',
    children: [
      { title: 'Overview', path: '/docs/backups' },
    ],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    icon: Database,
    color: 'slate',
    path: '/docs/infrastructure',
    children: [
      { title: 'Overview', path: '/docs/infrastructure' },
    ],
  },
]

const colorClasses: Record<string, { bg: string; text: string; hoverBg: string; hoverText: string }> = {
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    hoverBg: 'group-hover:bg-emerald-200',
    hoverText: 'group-hover:text-emerald-800',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hoverBg: 'group-hover:bg-blue-200',
    hoverText: 'group-hover:text-blue-800',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    hoverBg: 'group-hover:bg-purple-200',
    hoverText: 'group-hover:text-purple-800',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    hoverBg: 'group-hover:bg-orange-200',
    hoverText: 'group-hover:text-orange-800',
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    hoverBg: 'group-hover:bg-teal-200',
    hoverText: 'group-hover:text-teal-800',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    hoverBg: 'group-hover:bg-slate-200',
    hoverText: 'group-hover:text-slate-800',
  },
}

interface DocsSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isMobileMenuOpen?: boolean
  onMobileMenuClose?: () => void
}

export default function DocsSidebar({ isCollapsed, onToggle, isMobileMenuOpen, onMobileMenuClose }: DocsSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started', 'database']))
  const activeItemRef = useRef<HTMLAnchorElement>(null)

  // Load expanded sections from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('docs-sidebar-expanded')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setExpandedSections(new Set(parsed))
      } catch (e) {
        // Use default if parsing fails
      }
    }
  }, [])

  // Scroll active item into view when pathname changes
  useEffect(() => {
    if (activeItemRef.current && !isCollapsed) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [pathname, isCollapsed])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      // Persist to localStorage
      localStorage.setItem('docs-sidebar-expanded', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const isActive = (path: string) => {
    if (path === '/docs') {
      return pathname === '/docs'
    }
    return pathname.startsWith(path)
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 80 : 280,
        x: isMobileMenuOpen !== undefined ? (isMobileMenuOpen ? 0 : -280) : 0,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 overflow-hidden ${
        isMobileMenuOpen !== undefined ? 'z-50 md:z-40' : 'z-40'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {/* Mobile close button */}
          {isMobileMenuOpen !== undefined && onMobileMenuClose && (
            <button
              onClick={onMobileMenuClose}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
                  </svg>
                </div>
                <span className="text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {sidebarSections.map((section) => {
              const Icon = section.icon
              const colors = colorClasses[section.color]
              const active = isActive(section.path)
              const expanded = expandedSections.has(section.id)
              const hasChildren = section.children && section.children.length > 0

              return (
                <li key={section.id}>
                  <div
                    ref={active ? activeItemRef : null}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      active
                        ? `${colors.bg} ${colors.text} font-bold`
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Link
                      href={section.path}
                      onClick={onMobileMenuClose}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className={`p-2 rounded-lg ${colors.bg} ${colors.text} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 truncate"
                          >
                            {section.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                    {hasChildren && !isCollapsed && (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className={`p-1 rounded transition-transform ${expanded ? 'rotate-90' : ''}`}
                        aria-label={expanded ? 'Collapse section' : 'Expand section'}
                      >
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                    {active && !isCollapsed && !hasChildren && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-2 h-2 rounded-full bg-current flex-shrink-0"
                      />
                    )}
                  </div>

                  {/* Collapsible children */}
                  {hasChildren && !isCollapsed && (
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="ml-12 mt-1 space-y-1 overflow-hidden"
                        >
                          {section.children.map((child) => (
                            <li key={child.path}>
                              <Link
                                href={child.path}
                                onClick={onMobileMenuClose}
                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                  pathname === child.path
                                    ? `${colors.bg} ${colors.text} font-medium`
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {child.title}
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Toggle Button - hide on mobile */}
        <div className="hidden md:block p-4 border-t border-slate-200">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar (Cmd/Ctrl + B)' : 'Collapse sidebar (Cmd/Ctrl + B)'}
            title={isCollapsed ? 'Expand sidebar (Cmd/Ctrl + B)' : 'Collapse sidebar (Cmd/Ctrl + B)'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
          <div className="text-xs text-slate-400 text-center mt-1">
            {isMac() ? '⌘' : 'Ctrl'} + B
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
