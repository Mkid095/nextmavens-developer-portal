'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Github, FileText, Download, ArrowLeft, ArrowRight } from 'lucide-react'

export function SdkResources() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-8 border border-slate-200 mb-12"
    >
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Resources</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <a
          href="https://github.com/Mkid095/nextmavens-js"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
        >
          <Github className="w-5 h-5 text-slate-700" />
          <div>
            <p className="font-medium text-slate-900">GitHub Repository</p>
            <p className="text-sm text-slate-600">View source code</p>
          </div>
        </a>
        <a
          href="https://github.com/Mkid095/nextmavens-js/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
        >
          <FileText className="w-5 h-5 text-slate-700" />
          <div>
            <p className="font-medium text-slate-900">Report an Issue</p>
            <p className="text-sm text-slate-600">File bugs and requests</p>
          </div>
        </a>
        <a
          href="https://github.com/Mkid095/nextmavens-js/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition"
        >
          <Download className="w-5 h-5 text-slate-700" />
          <div>
            <p className="font-medium text-slate-900">Contributing</p>
            <p className="text-sm text-slate-600">How to contribute</p>
          </div>
        </a>
      </div>
    </motion.div>
  )
}

export function SdkNavigation() {
  return (
    <div className="mt-12 flex items-center justify-between">
      <Link href="/docs/realtime" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Realtime Docs
      </Link>
      <Link href="/docs/platform-philosophy" className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium">
        Platform Philosophy
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
