'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
          : 'bg-white/90 backdrop-blur-md border-b border-slate-200'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.25)]">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-[-0.02em]">
              nextmavens
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Features
            </Link>
            <Link href="#services" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Services
            </Link>
            <Link href="/mcp" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              MCP & AI
            </Link>
            <Link href="/docs" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Docs
            </Link>
            <Link href="#comparison" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://portal.nextmavens.cloud"
              className="btn-secondary"
            >
              Dashboard
            </a>
            <button className="btn-primary">Get Started</button>
          </div>
        </div>
      </div>
    </nav>
  )
}
