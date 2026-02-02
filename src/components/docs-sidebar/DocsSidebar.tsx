'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DocsSidebarProps } from './types'
import { sidebarSections } from './sections'
import { colorClasses } from './colors'
import { isActivePath, isMac } from './utils'
import { DocsSidebarLogo } from './Logo'

const STORAGE_KEY = 'docs-sidebar-expanded'

export default function DocsSidebar({ isCollapsed, onToggle, isMobileMenuOpen, onMobileMenuClose }: DocsSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started', 'database']))
  const activeItemRef = useRef<HTMLDivElement>(null)

  // Load expanded sections from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setExpandedSections(new Set(parsed))
      } catch {
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)))
      return newSet
    })
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
                  <DocsSidebarLogo isCollapsed={false} />
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
                  <DocsSidebarLogo isCollapsed={true} />
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
              const active = isActivePath(section.path, pathname)
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
                          {section.children?.map((child) => (
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
