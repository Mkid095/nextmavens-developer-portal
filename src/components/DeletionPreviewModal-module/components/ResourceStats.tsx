/**
 * Deletion Preview Modal - Resource Statistics Component
 */

import { Trash2, Database, Key, Webhook, Code2, HardDrive, Lock } from 'lucide-react'
import type { DeletionPreviewData } from '../types'

interface ResourceStatsProps {
  preview: DeletionPreviewData
}

export function ResourceStats({ preview }: ResourceStatsProps) {
  return (
    <>
      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Warning: Project Deletion</h3>
            <p className="text-sm text-red-700 mt-1">
              You are about to delete <strong>{preview.project.name}</strong>. This will affect{' '}
              <strong>multiple resources</strong>. Review the details below before confirming.
            </p>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-medium text-slate-900 mb-3">Project Information</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-600">Project ID</span>
            <p className="font-mono text-slate-900">{preview.project.id}</p>
          </div>
          <div>
            <span className="text-slate-600">Slug</span>
            <p className="font-mono text-slate-900">{preview.project.slug}</p>
          </div>
        </div>
      </div>

      {/* What Will Be Deleted */}
      <div>
        <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Resources to be Deleted
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Schemas */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.schemas}</p>
            <p className="text-xs text-slate-600">Database Schemas</p>
          </div>

          {/* Tables */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <Database className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.tables}</p>
            <p className="text-xs text-slate-600">Database Tables</p>
          </div>

          {/* API Keys */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <Key className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-slate-900">
              {Object.values(preview.will_be_deleted.api_keys).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-xs text-slate-600">API Keys</p>
          </div>

          {/* Webhooks */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <Webhook className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.webhooks}</p>
            <p className="text-xs text-slate-600">Webhooks</p>
          </div>

          {/* Edge Functions */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <Code2 className="w-6 h-6 text-teal-600 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.edge_functions}</p>
            <p className="text-xs text-slate-600">Edge Functions</p>
          </div>

          {/* Storage Buckets */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <HardDrive className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.storage_buckets}</p>
            <p className="text-xs text-slate-600">Storage Buckets</p>
          </div>

          {/* Secrets */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-center">
            <Lock className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-slate-900">{preview.will_be_deleted.secrets}</p>
            <p className="text-xs text-slate-600">Secrets</p>
          </div>
        </div>

        {/* API Keys Breakdown */}
        {Object.keys(preview.will_be_deleted.api_keys).length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-900 mb-2">API Keys by Type:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(preview.will_be_deleted.api_keys).map(([type, count]) => (
                <span
                  key={type}
                  className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded font-medium"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
