'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Globe,
  Github,
  ChevronRight,
  Code2,
} from 'lucide-react'
import { useState } from 'react'

// Components
import {
  SoftButton,
  OverviewSection,
  InstallationSection,
  TokenTypesSection,
  ToolDetailsSection,
  ExamplesSection,
  TroubleshootingSection,
} from './components'

// Constants
import { navItems } from './constants'

export default function MCPPage() {
  const [activeSection, setActiveSection] = useState<string>('overview')

  return (
    <div className="min-h-screen w-full bg-[#F3F5F7]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-lg font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="/#solutions" className="text-sm text-slate-600 hover:text-slate-900">Solutions</a>
            <a href="/#product" className="text-sm text-slate-600 hover:text-slate-900">Product</a>
            <a href="/docs" className="text-sm text-slate-600 hover:text-slate-900">Docs</a>
            <a href="/mcp" className="text-sm text-emerald-700 font-medium">MCP</a>
          </div>

          <div className="hidden gap-2 md:flex">
            <a href="/login" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Login
            </a>
            <SoftButton>
              <a href="/register" className="text-white hover:text-white">
                Sign Up
              </a>
            </SoftButton>
          </div>
        </div>
      </nav>

      <main className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block w-64 bg-white border-r border-slate-200 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto sidebar-scroll">
          <div className="p-4">
            <div className="mb-6">
              <Link href="/mcp" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to MCP
              </Link>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.tools && (
                      <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {item.tools.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <a
                href="https://github.com/Mkid095/nextmavens-mcp-server"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <Github className="w-4 h-4" />
                GitHub Repo
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="p-8 max-w-4xl">
            <AnimatePresence mode="wait">
              {/* Overview Section */}
              {activeSection === 'overview' && <OverviewSection onSectionChange={setActiveSection} />}

              {/* Installation Section */}
              {activeSection === 'installation' && <InstallationSection />}

              {/* Token Types Section */}
              {activeSection === 'token-types' && <TokenTypesSection />}

              {/* Tool Sections (Database, Auth, Storage, GraphQL) */}
              {['database', 'auth', 'storage', 'graphql'].includes(activeSection) && (
                <ToolDetailsSection activeSection={activeSection} />
              )}

              {/* Examples Section */}
              {activeSection === 'examples' && <ExamplesSection />}

              {/* Troubleshooting Section */}
              {activeSection === 'troubleshooting' && <TroubleshootingSection />}
            </AnimatePresence>

            {/* CTA at bottom */}
            <div className="mt-12 pt-8 border-t border-slate-200 text-center">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Ready to integrate?</h2>
              <p className="text-slate-600 mb-6 max-w-xl mx-auto">
                Get your API key and start using NextMavens MCP tools in your AI workflow today.
              </p>
              <div className="flex items-center justify-center gap-4">
                <SoftButton>
                  <a href="/register" className="flex items-center text-white hover:text-white">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </SoftButton>
                <a
                  href="https://github.com/Mkid095/nextmavens-mcp-server"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
                >
                  <Github className="w-4 h-4" />
                  GitHub Repo
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
