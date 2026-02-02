/**
 * Dashboard Hooks - Module - Types
 */

import type { ApiKey, Project, Developer, Toast } from '../utils'

export type KeyEnvironment = 'live' | 'test' | 'dev'
export type ProjectEnvironment = 'prod' | 'dev' | 'staging'
export type ProjectFilter = 'active' | 'deleted'

export interface DashboardState {
  developer: Developer | null
  apiKeys: ApiKey[]
  projects: Project[]
  deletedProjects: Project[]
  loading: boolean
  projectFilter: ProjectFilter
  copied: string | null
  toasts: Toast[]
}

export interface ModalStates {
  showApiKeyModal: boolean
  showProjectModal: boolean
  showSecretModal: boolean
  createdSecretKey: string
  createdKeyName: string
}

export interface FormStates {
  apiKeyName: string
  projectName: string
  keyEnvironment: KeyEnvironment
  projectEnvironment: ProjectEnvironment
  submitting: boolean
  error: string
}

export interface CreateApiKeyData {
  name: string
  key_type: string
  environment: KeyEnvironment
  scopes: string[]
}
