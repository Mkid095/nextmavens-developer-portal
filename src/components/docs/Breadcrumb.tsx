'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { Fragment } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

export default function Breadcrumb() {
  const pathname = usePathname()

  // Don't show breadcrumb on the docs index page
  if (pathname === '/docs') {
    return null
  }

  // Build breadcrumb items from pathname
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = []
    const segments = pathname.split('/').filter(Boolean)

    // Add "Docs" as the first item
    items.push({ label: 'Docs', href: '/docs' })

    // Process segments
    let currentPath = ''
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]

      // Skip 'docs' segment as we already added it
      if (segment === 'docs') continue

      currentPath += `/${segment}`

      // Format the segment label
      let label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      // Add to breadcrumbs (but not the current page as a link)
      if (i < segments.length - 1) {
        items.push({ label, href: currentPath })
      }
    }

    return items
  }

  const breadcrumbs = buildBreadcrumbs()

  // Get the current page title from the last segment
  const currentPageTitle = pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 mb-6" aria-label="Breadcrumb">
      <Link
        href="/"
        className="hover:text-slate-900 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <Fragment key={item.href}>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <Link
            href={item.href}
            className="hover:text-slate-900 transition-colors"
          >
            {item.label}
          </Link>
        </Fragment>
      ))}

      {currentPageTitle && (
        <>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-900 font-medium">{currentPageTitle}</span>
        </>
      )}
    </nav>
  )
}
