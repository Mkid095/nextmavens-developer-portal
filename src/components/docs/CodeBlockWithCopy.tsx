'use client'

import { useState, useRef } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockWithCopyProps {
  children: string
  className?: string
}

/**
 * A code block component with a copy button for inline use in docs.
 * Use this for static code examples in documentation pages.
 */
export default function CodeBlockWithCopy({ children, className }: CodeBlockWithCopyProps) {
  const [isCopied, setIsCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  const handleCopy = async () => {
    if (!codeRef.current) return

    const code = codeRef.current.textContent || ''
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)

      // Auto-hide feedback after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className={cn('relative group my-4', className)}>
      {/* Copy button */}
      <div className="absolute right-2 top-2 z-10">
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
            'opacity-0 group-hover:opacity-100',
            isCopied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
          aria-label={isCopied ? 'Copied!' : 'Copy code'}
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code block */}
      <pre className="bg-slate-900 text-slate-50 rounded-lg p-4 overflow-x-auto">
        <code ref={codeRef} className="text-sm">
          {children}
        </code>
      </pre>
    </div>
  )
}
