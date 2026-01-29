'use client'

import { useState, useEffect } from 'react'
import DocsSidebar from './DocsSidebar'

interface DocsLayoutProps {
  children: React.ReactNode
}

const STORAGE_KEY = 'docs-sidebar-collapsed'

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)

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

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      {/* Sidebar */}
      <DocsSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />

      {/* Main Content */}
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isClient ? (isCollapsed ? '80px' : '280px') : '280px',
        }}
      >
        {children}
      </main>
    </div>
  )
}
