/**
 * Database Documentation - Module - Constants
 */

import type { HttpMethod } from './types'

export const DATABASE_CONFIG = {
  domain: 'https://api.nextmavens.cloud',
  port: 3001,
  features: ['CRUD Operations', 'RLS Policies', 'Prepared Statements', 'Multi-tenant'],
} as const

export const ENDPOINTS = [
  {
    name: 'List Records',
    method: 'GET' as HttpMethod,
    path: '/{table}',
    description: 'Get all records from a table with optional filtering',
    examples: [
      { url: '/users', description: 'Get all users' },
      { url: '/users?id=eq.1', description: 'Get user by ID' },
      { url: '/users?select=id,name,email', description: 'Select specific columns' },
      { url: '/users?order=created_at.desc&limit=10', description: 'Paginated results' },
    ],
  },
  {
    name: 'Get Single Record',
    method: 'GET' as HttpMethod,
    path: '/{table}/{id}',
    description: 'Get a specific record by primary key',
    examples: [{ url: '/users/1', description: 'Get user with id=1' }],
  },
  {
    name: 'Create Record',
    method: 'POST' as HttpMethod,
    path: '/{table}',
    description: 'Insert a new record into a table',
    examples: [{ url: '/users', description: 'Create new user' }],
  },
  {
    name: 'Update Record',
    method: 'PATCH' as HttpMethod,
    path: '/{table}/{id}',
    description: 'Update a specific record by primary key',
    examples: [{ url: '/users/1', description: 'Update user with id=1' }],
  },
  {
    name: 'Delete Record',
    method: 'DELETE' as HttpMethod,
    path: '/{table}/{id}',
    description: 'Delete a specific record by primary key',
    examples: [{ url: '/users/1', description: 'Delete user with id=1' }],
  },
  {
    name: 'RPC Function',
    method: 'POST' as HttpMethod,
    path: '/rpc/{function}',
    description: 'Call a PostgreSQL stored function',
    examples: [{ url: '/rpc/get_user_stats', description: 'Call custom function' }],
  },
] as const

export const FILTER_OPERATORS = [
  { operator: 'eq', description: 'Equals', example: 'id=eq.1' },
  { operator: 'neq', description: 'Not equals', example: 'status=neq.inactive' },
  { operator: 'gt', description: 'Greater than', example: 'age=gt.18' },
  { operator: 'gte', description: 'Greater than or equal', example: 'age=gte.18' },
  { operator: 'lt', description: 'Less than', example: 'age=lt.65' },
  { operator: 'lte', description: 'Less than or equal', example: 'age=lte.65' },
  { operator: 'like', description: 'Pattern match', example: 'name=like.John%' },
  { operator: 'ilike', description: 'Case-insensitive match', example: 'email=ilike.%@gmail.com' },
  { operator: 'in', description: 'In array', example: 'id=in.(1,2,3)' },
  { operator: 'is', description: 'NULL check', example: 'deleted_at=is.null' },
  { operator: 'and', description: 'AND condition', example: 'and=(age.gte.18,status.eq.active)' },
  { operator: 'or', description: 'OR condition', example: 'or=(id.eq.1,id.eq.2)' },
] as const

export const AVAILABLE_TABLES = ['users', 'tenants', 'api_keys', 'audit_logs', 'projects', 'files'] as const

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
  PUT: 'bg-purple-100 text-purple-700',
}
