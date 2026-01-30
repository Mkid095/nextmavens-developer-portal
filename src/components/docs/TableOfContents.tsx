'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  className?: string
}

export default function TableOfContents({ className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Extract headings from the page
  useEffect(() => {
    const content = document.querySelector('main')
    if (!content) return

    const elements = content.querySelectorAll('h1, h2, h3, h4')
    const extractedHeadings: Heading[] = Array.from(elements).map((element) => {
      const id = element.id || element.textContent?.toLowerCase().replace(/\s+/g, '-') || ''
      if (!element.id) {
        element.id = id
      }
      return {
        id,
        text: element.textContent || '',
        level: parseInt(element.tagName.substring(1)),
      }
    })

    setHeadings(extractedHeadings)
  }, [])

  // Update active heading on scroll
  const updateActiveHeading = useCallback(() => {
    const headingElements = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[]

    if (headingElements.length === 0) return

    // Find the heading that's currently in view
    const visibleHeading = headingElements.find((element) => {
      const rect = element.getBoundingClientRect()
      return rect.top >= 0 && rect.top <= 200
    })

    if (visibleHeading) {
      setActiveId(visibleHeading.id)
    } else {
      // If no heading is in view, use the last one that's above the viewport
      const lastHeadingAbove = [...headingElements].reverse().find((element) => {
        const rect = element.getBoundingClientRect()
        return rect.top <= 0
      })

      if (lastHeadingAbove) {
        setActiveId(lastHeadingAbove.id)
      } else if (headingElements[0]) {
        setActiveId(headingElements[0].id)
      }
    }
  }, [headings])

  useEffect(() => {
    if (headings.length === 0) return

    updateActiveHeading()

    window.addEventListener('scroll', updateActiveHeading, { passive: true })
    return () => window.removeEventListener('scroll', updateActiveHeading)
  }, [headings, updateActiveHeading])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 100 // Account for fixed headers
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })

      // Update URL without triggering scroll
      history.replaceState(null, '', `#${id}`)
      setActiveId(id)
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <nav
      className={cn(
        'hidden lg:block fixed right-0 top-20 w-64 pr-8',
        'max-h-[calc(100vh-6rem)] overflow-y-auto',
        'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent',
        className
      )}
      aria-label="Table of contents"
    >
      <div className="pb-8">
        <h4 className="text-sm font-semibold text-slate-900 mb-4">On this page</h4>
        <ul className="space-y-2 text-sm">
          {headings.map((heading) => {
            const isActive = heading.id === activeId
            const paddingLeft = (heading.level - 1) * 16

            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                  className={cn(
                    'block py-1.5 transition-colors duration-200',
                    'hover:text-slate-900',
                    isActive
                      ? 'text-emerald-700 font-medium border-l-2 border-emerald-700 pl-3'
                      : 'text-slate-600 border-l-2 border-transparent pl-3'
                  )}
                  style={{ paddingLeft: `${paddingLeft + 12}px` }}
                >
                  {heading.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
