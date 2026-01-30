'use client'

import { useEffect } from 'react'

interface CodeBlockEnhancerProps {
  selector?: string
}

/**
 * Automatically adds copy buttons to all code blocks in the documentation.
 * This component should be placed in the DocsLayout to enhance all code blocks.
 */
export default function CodeBlockEnhancer({ selector = 'pre > code' }: CodeBlockEnhancerProps) {
  useEffect(() => {
    // Find all code blocks
    const codeBlocks = document.querySelectorAll(selector)

    codeBlocks.forEach((codeBlock) => {
      // Skip if already enhanced
      const pre = codeBlock.parentElement
      if (!pre || pre.hasAttribute('data-enhanced')) return

      // Mark as enhanced
      pre.setAttribute('data-enhanced', 'true')
      pre.classList.add('relative', 'group')

      // Create wrapper
      const wrapper = document.createElement('div')
      wrapper.className = 'relative group my-4'

      // Create button container
      const buttonContainer = document.createElement('div')
      buttonContainer.className = 'absolute right-2 top-2 flex items-center gap-2 z-10'

      // Get language from class
      const languageMatch = Array.from(codeBlock.classList)
        .find((cls) => cls.startsWith('language-'))
        ?.replace('language-', '')
      const language = languageMatch || 'text'

      // Add language label if not text
      if (language !== 'text') {
        const langLabel = document.createElement('span')
        langLabel.className = 'text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded'
        langLabel.textContent = language
        buttonContainer.appendChild(langLabel)
      }

      // Create copy button
      const copyButton = document.createElement('button')
      copyButton.className =
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-700 hover:bg-slate-200'
      copyButton.setAttribute('aria-label', 'Copy code')
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span>Copy</span>
      `

      // Handle copy click
      copyButton.addEventListener('click', async () => {
        const code = codeBlock.textContent || ''
        try {
          await navigator.clipboard.writeText(code)

          // Show copied state
          copyButton.className =
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all bg-emerald-100 text-emerald-700'
          copyButton.setAttribute('aria-label', 'Copied!')
          copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Copied!</span>
          `

          // Reset after 2 seconds
          setTimeout(() => {
            copyButton.className =
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-700 hover:bg-slate-200'
            copyButton.setAttribute('aria-label', 'Copy code')
            copyButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>Copy</span>
            `
          }, 2000)
        } catch (err) {
          console.error('Failed to copy code:', err)
        }
      })

      buttonContainer.appendChild(copyButton)

      // Wrap the pre element
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(pre)
      wrapper.appendChild(buttonContainer)
    })

    // Cleanup function
    return () => {
      // Remove enhanced attributes when component unmounts
      const enhancedPres = document.querySelectorAll('pre[data-enhanced="true"]')
      enhancedPres.forEach((pre) => {
        pre.removeAttribute('data-enhanced')
        const wrapper = pre.parentElement
        if (wrapper?.classList.contains('relative')) {
          const buttonContainer = wrapper.querySelector('div.absolute.right-2.top-2')
          if (buttonContainer) {
            buttonContainer.remove()
          }
        }
      })
    }
  }, [selector])

  return null // This component doesn't render anything
}
