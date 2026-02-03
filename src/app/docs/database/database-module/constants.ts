/**
 * Database Docs Module - Constants
 */

import type { DatabaseConfig, Endpoint, FilterOperator } from './types'

/**
 * Database service configuration
 */
export const DATABASE_CONFIG: DatabaseConfig = {
  domain: 'https://api.nextmavens.cloud',
  port: 3001,
  features: ['CRUD Operations', 'RLS Policies', 'Prepared Statements', 'Multi-tenant'],
} as const

/**
 * API endpoints documentation
 */
export const API_ENDPOINTS: Endpoint[] = [
  {
    name: 'List Records',
    method: 'GET',
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
    method: 'GET',
    path: '/{table}/{id}',
    description: 'Get a specific record by primary key',
    examples: [{ url: '/users/1', description: 'Get user with id=1' }],
  },
  {
    name: 'Create Record',
    method: 'POST',
    path: '/{table}',
    description: 'Insert a new record into a table',
    examples: [{ url: '/users', description: 'Create new user' }],
  },
  {
    name: 'Update Record',
    method: 'PATCH',
    path: '/{table}/{id}',
    description: 'Update a specific record by primary key',
    examples: [{ url: '/users/1', description: 'Update user with id=1' }],
  },
  {
    name: 'Delete Record',
    method: 'DELETE',
    path: '/{table}/{id}',
    description: 'Delete a specific record by primary key',
    examples: [{ url: '/users/1', description: 'Delete user with id=1' }],
  },
  {
    name: 'RPC Function',
    method: 'POST',
    path: '/rpc/{function}',
    description: 'Call a PostgreSQL stored function',
    examples: [{ url: '/rpc/get_user_stats', description: 'Call custom function' }],
  },
] as const

/**
 * Filter operators reference
 */
export const FILTER_OPERATORS: FilterOperator[] = [
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

/**
 * Available schema tables
 */
export const AVAILABLE_TABLES = ['users', 'tenants', 'api_keys', 'audit_logs', 'projects', 'files'] as const

/**
 * Method color mappings
 */
export const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'bg-blue-100', text: 'text-blue-700' },
  POST: { bg: 'bg-green-100', text: 'text-green-700' },
  PATCH: { bg: 'bg-orange-100', text: 'text-orange-700' },
  DELETE: { bg: 'bg-red-100', text: 'text-red-700' },
  PUT: { bg: 'bg-purple-100', text: 'text-purple-700' },
} as const

/**
 * Code example snippets
 */
export const CODE_EXAMPLES = {
  FETCH_WITH_FILTERS: `// Fetch users with filtering
const response = await fetch(
  'https://api.nextmavens.cloud/users?id=eq.1&select=id,name,email',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Accept': 'application/json'
    }
  }
);
const users = await response.json();`,

  CREATE_RECORD: `// Create a new user
const response = await fetch('https://api.nextmavens.cloud/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    status: 'active'
  })
});
const newUser = await response.json();`,

  UPDATE_RECORD: `// Update user by ID
const response = await fetch('https://api.nextmavens.cloud/users/1', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Jane Doe',
    updated_at: new Date().toISOString()
  })
});
const updated = await response.json();`,
} as const
