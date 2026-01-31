'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  FolderOpen,
  Settings,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Plus,
  Calendar,
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  user_role?: 'owner' | 'admin' | 'developer' | 'viewer'
  created_at: string
  members?: Array<{
    user_id: string
    name: string
    email: string
    role: string
    joined_at: string
  }>
}

interface Project {
  id: string
  name: string
  slug: string
  environment: string
  status: string
  created_at: string
}

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

export default function OrganizationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (slug) {
      fetchOrganization()
      fetchProjects()
    }
  }, [slug])

  const fetchOrganization = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        router.push('/login')
        return
      }

      // First get all organizations to find the one with this slug
      const response = await fetch('/api/organizations/with-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization')
      }

      const data = await response.json()
      const org = (data.organizations || []).find((o: Organization) => o.slug === slug)

      if (!org) {
        throw new Error('Organization not found')
      }

      // Get detailed organization info including members
      const detailResponse = await fetch(`/api/organizations/${org.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        setOrganization(detailData.data || org)
      } else {
        setOrganization(org)
      }
    } catch (err) {
      console.error('Error fetching organization:', err)
      showToast('error', 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        return
      }

      const response = await fetch(`/api/projects?organization_id=${organization?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  useEffect(() => {
    if (organization?.id) {
      fetchProjects()
    }
  }, [organization])

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'developer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'viewer':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'suspended':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'archived':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-900 animate-spin" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Organization Not Found</h2>
          <p className="text-slate-600 mb-6">The organization you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/organizations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white rounded-xl font-medium hover:bg-emerald-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/organizations"
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{organization.name}</h1>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(organization.user_role || 'viewer')}`}>
                    {organization.user_role || 'viewer'}
                  </span>
                </div>
                <p className="text-slate-600 mt-1">@{organization.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/organizations/${organization.slug}/settings`}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Projects Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
              <span className="text-sm text-slate-600">{projects.length} total</span>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">No projects in this organization yet</p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm text-emerald-900 font-medium hover:text-emerald-800"
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map(project => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.slug}`}
                    className="block p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900">{project.name}</h3>
                        <p className="text-sm text-slate-500">@{project.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">{project.environment}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Members</h2>
              <span className="text-sm text-slate-600">
                {(organization.members?.length || 0) + 1} total
              </span>
            </div>
            <div className="space-y-2">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Owner</p>
                    <p className="text-sm text-slate-500">ID: {organization.owner_id}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor('owner')}`}>
                  owner
                </span>
              </div>
              {/* Members */}
              {organization.members?.map(member => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-700">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
              )) || (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No additional members</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization Details</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Organization ID</dt>
              <dd className="mt-1 text-sm text-slate-900 font-mono">{organization.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Created</dt>
              <dd className="mt-1 text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(organization.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
