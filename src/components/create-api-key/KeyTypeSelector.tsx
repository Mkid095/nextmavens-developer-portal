/**
 * Key Type Selection Step Component
 *
 * First step: Select the type of API key to create.
 */

'use client'

import { Check, Globe, Key, Shield, Cpu } from 'lucide-react'
import type { KeyTypeOption } from './types'
import type { ApiKeyType } from '@/lib/types/api-key.types'

interface KeyTypeSelectorProps {
  selectedType: ApiKeyType | null
  onSelect: (option: KeyTypeOption) => void
}

const KEY_TYPE_OPTIONS: KeyTypeOption[] = [
  {
    type: 'public',
    title: 'Public Key',
    description: 'Safe for client-side apps. Read-only access to data.',
    icon: Globe,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    warning: 'This key is intended for client-side use in browsers or mobile apps. It has read-only access and can be safely exposed in public code.',
    defaultScopes: ['read'],
    useCases: ['Frontend web apps', 'Mobile apps', 'Public APIs', 'Browser SDKs'],
  },
  {
    type: 'secret',
    title: 'Secret Key',
    description: 'Full CRUD access. For server-side applications only.',
    icon: Key,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    warning: 'This key must be kept secret and never exposed in client-side code (browsers, mobile apps). Only use this key in server-side environments where it cannot be accessed by users.',
    defaultScopes: ['read', 'write'],
    useCases: ['Backend servers', 'API integrations', 'CLI tools', 'Serverless functions'],
  },
  {
    type: 'service_role',
    title: 'Service Role Key',
    description: 'Bypasses RLS. Full admin access for trusted services.',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    warning: 'WARNING: This is a service role key that bypasses row-level security (RLS) and has full administrative access. It must be kept secret and never exposed in client-side code. Only use this key in trusted server-side environments for admin operations.',
    defaultScopes: ['read', 'write', 'admin'],
    useCases: ['Admin tasks', 'Database migrations', 'Trusted backend services', 'Cron jobs'],
  },
  {
    type: 'mcp',
    title: 'MCP Token',
    description: 'For AI tools and Model Context Protocol integrations.',
    icon: Cpu,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    warning: 'This token is for use with AI assistants and MCP-compatible tools. Different access levels provide varying permissions. Keep tokens secure and rotate regularly.',
    defaultScopes: ['mcp_read'],
    useCases: ['AI assistants', 'Claude MCP integration', 'Automated agents', 'Tool integrations'],
  },
]

export function KeyTypeSelector({ selectedType, onSelect }: KeyTypeSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Key Type</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {KEY_TYPE_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = selectedType === option.type
          return (
            <button
              key={option.type}
              onClick={() => onSelect(option)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? `${option.borderColor} ${option.bgColor}`
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${option.bgColor}`}>
                  <Icon className={`w-6 h-6 ${option.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${option.color}`}>{option.title}</h4>
                </div>
                {isSelected && (
                  <div className={`w-6 h-6 rounded-full ${option.bgColor} flex items-center justify-center`}>
                    <Check className={`w-4 h-4 ${option.color}`} />
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3">{option.description}</p>
              <div className={`text-xs p-2 rounded ${option.bgColor} border ${option.borderColor}`}>
                <span className="font-medium">{option.warning}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {option.useCases.map((useCase) => (
                  <span
                    key={useCase}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
