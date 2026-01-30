'use client'

import { useState, useEffect } from 'react'
import DocsSidebar from './DocsSidebar'
import TableOfContents from './docs/TableOfContents'
import Breadcrumb from './docs/Breadcrumb'
import CodeBlockEnhancer from './docs/CodeBlockEnhancer'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'

interface DocsLayoutProps {
  children: React.ReactNode
}

const STORAGE_KEY = 'docs-sidebar-collapsed'

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
  }, [])

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed))
    }
  }, [isCollapsed, isClient])

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobileMenuOpen])

  // Keyboard shortcut to toggle sidebar (Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + B
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        handleToggle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev)
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev)
  }

  const handleBackdropClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleMobileMenuToggle}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-lg font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <DocsSidebar
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isClient ? (isCollapsed ? '80px' : '280px') : '280px',
        }}
      >
        <div className="md:hidden pt-14" /> {/* Mobile header spacer */}

        <div className="max-w-4xl px-6 py-8 md:px-8 md:py-12">
          {/* Breadcrumb Navigation */}
          <Breadcrumb />

          {/* Code Block Copy Buttons */}
          <CodeBlockEnhancer />

          {children}
        </div>
      </main>

      {/* Table of Contents */}
      <TableOfContents />
    </div>
  )
}
