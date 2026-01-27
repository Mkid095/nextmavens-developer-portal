'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LogOut,
  Key,
  Plus,
  Database,
  Shield,
  HardDrive,
  Globe,
  Copy,
  Check,
  Trash2,
  Settings,
} from 'lucide-react'

interface Developer {
  id: string
  email: string
  name: string
  organization?: string
}

interface ApiKey {
  id: string
  name: string
  public_key: string
  created_at: string
}

interface Project {
  id: string
  name: string
  slug: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    fetchDeveloperData()
    fetchApiKeys()
    fetchProjects()
  }, [router])

  const fetchDeveloperData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/developer/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.clear()
          router.push('/login')
        }
        return
      }

      const data = await res.json()
      setDeveloper(data.developer)
    } catch (err) {
      console.error('Failed to fetch developer:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const handleCreateApiKey = async () => {
    const name = prompt('Enter a name for this API key:')
    if (!name) return

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Your secret key: ${data.secretKey}\n\nSave it now! You won't see it again.`)
        fetchApiKeys()
      }
    } catch (err) {
      console.error('Failed to create API key:', err)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCreateProject = async () => {
    const name = prompt('Enter project name:')
    if (!name) return

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        fetchProjects()
      }
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        :root { --font-sans: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
        .font-jakarta { font-family: var(--font-sans); }
      `}</style>

      <nav className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1180px] px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-white shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12c5 0 4-8 10-8 0 3 6 3 6 8s-6 5-6 8c-6 0-5-8-10-8Z" fill="currentColor" />
              </svg>
            </div>
            <span className="font-jakarta text-xl font-semibold tracking-tight text-slate-900">nextmavens</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{developer?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {developer?.name}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Key className="w-5 h-5 text-emerald-700" />
                </div>
                <span className="font-medium text-slate-900">API Keys</span>
              </div>
              <div className="text-3xl font-semibold text-slate-900">{apiKeys.length}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-700" />
                </div>
                <span className="font-medium text-slate-900">Projects</span>
              </div>
              <div className="text-3xl font-semibold text-slate-900">{projects.length}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-700" />
                </div>
                <span className="font-medium text-slate-900">Services</span>
              </div>
              <div className="text-3xl font-semibold text-slate-900">5</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">API Keys</h2>
                <button
                  onClick={handleCreateApiKey}
                  className="flex items-center gap-2 text-sm bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
                >
                  <Plus className="w-4 h-4" />
                  Create Key
                </button>
              </div>
              <div className="p-6 space-y-4">
                {apiKeys.length === 0 ? (
                  <p className="text-slate-500 text-sm">No API keys yet. Create one to get started.</p>
                ) : (
                  apiKeys.map((key) => (
                    <div key={key.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{key.name}</div>
                          <code className="text-sm text-slate-600 mt-1 block">{key.public_key}</code>
                        </div>
                        <button
                          onClick={() => handleCopy(key.public_key, key.id)}
                          className="p-2 hover:bg-slate-200 rounded-lg"
                        >
                          {copied === key.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
                <button
                  onClick={handleCreateProject}
                  className="flex items-center gap-2 text-sm bg-emerald-900 text-white px-4 py-2 rounded-lg hover:bg-emerald-800"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
              <div className="p-6 space-y-4">
                {projects.length === 0 ? (
                  <p className="text-slate-500 text-sm">No projects yet. Create one to get started.</p>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{project.name}</div>
                        <code className="text-xs text-slate-500">{project.slug}</code>
                      </div>
                      <Link href={`/dashboard/projects/${project.slug}`} className="text-sm text-emerald-700 hover:text-emerald-800">
                        Open
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Available Services</h2>
            </div>
            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/mcp" className="p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition">
                <Globe className="w-8 h-8 text-emerald-700 mb-3" />
                <h3 className="font-medium text-slate-900">MCP</h3>
                <p className="text-sm text-slate-600 mt-1">Model Context Protocol integration</p>
              </Link>

              <div className="p-4 border border-slate-200 rounded-xl">
                <Database className="w-8 h-8 text-blue-700 mb-3" />
                <h3 className="font-medium text-slate-900">Database</h3>
                <p className="text-sm text-slate-600 mt-1">PostgreSQL-powered queries</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl">
                <Shield className="w-8 h-8 text-purple-700 mb-3" />
                <h3 className="font-medium text-slate-900">Auth</h3>
                <p className="text-sm text-slate-600 mt-1">Authentication & authorization</p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl">
                <HardDrive className="w-8 h-8 text-orange-700 mb-3" />
                <h3 className="font-medium text-slate-900">Storage</h3>
                <p className="text-sm text-slate-600 mt-1">File storage & CDN</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
