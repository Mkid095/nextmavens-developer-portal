'use client'

import { ReactNode } from 'react'
import { BookOpen, Link as LinkIcon } from 'lucide-react'

interface ServiceTabProps {
  /**
   * The name of the service (e.g., "Database", "Auth", "Storage")
   */
  serviceName: string

  /**
   * Brief description of what this service does
   */
  overview: string

  /**
   * When to use this service - helps developers understand the use case
   */
  whenToUse: string

  /**
   * Quick start content - typically code examples or installation instructions
   */
  quickStart: ReactNode

  /**
   * Connection details - endpoint URLs, credentials, etc.
   */
  connectionDetails: ReactNode

  /**
   * URL to full documentation for this service
   */
  docsUrl: string

  /**
   * Optional additional sections to include
   */
  additionalSections?: ReactNode
}

/**
 * ServiceTab Component
 *
 * A reusable component that provides a consistent layout for all service tabs
 * in the project detail page. Each service tab follows the same structure:
 * - Overview: What is this service?
 * - When to Use: When should you use it?
 * - Quick Start: How to get started quickly
 * - Connection Details: How to connect to the service
 * - Documentation: Link to full docs
 *
 * This consistency reduces friction and helps developers understand each service.
 */
export default function ServiceTab({
  serviceName,
  overview,
  whenToUse,
  quickStart,
  connectionDetails,
  docsUrl,
  additionalSections,
}: ServiceTabProps) {
  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-3">What is the {serviceName} Service?</h2>
        <p className="text-slate-700 leading-relaxed">{overview}</p>
      </section>

      {/* When to Use Section */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-3">When to use it</h2>
        <p className="text-slate-700 leading-relaxed">{whenToUse}</p>
      </section>

      {/* Quick Start Section */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Quick Start</h2>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          {quickStart}
        </div>
      </section>

      {/* Connection Details Section */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Connection Details</h2>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          {connectionDetails}
        </div>
      </section>

      {/* Documentation Link */}
      <section>
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition font-medium"
        >
          <BookOpen className="w-4 h-4" />
          <span>Full Documentation</span>
          <LinkIcon className="w-4 h-4" />
        </a>
      </section>

      {/* Additional Sections */}
      {additionalSections && (
        <section>
          {additionalSections}
        </section>
      )}
    </div>
  )
}
