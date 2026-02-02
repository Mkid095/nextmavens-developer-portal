/**
 * MCP Page Constants
 *
 * Navigation items, tool details, and configuration for the MCP documentation page.
 */

import { Globe, Terminal, Key, Database, Shield, HardDrive, Code2, BookOpen, Settings } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: any
  section: string
  tools?: Array<{ name: string; desc: string }>
}

export interface ToolParam {
  name: string
  type: string
  required: boolean
  description: string
}

export interface ToolDetail {
  description: string
  params: ToolParam[]
}

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Globe, section: 'overview' },
  { id: 'installation', label: 'Installation', icon: Terminal, section: 'installation' },
  { id: 'token-types', label: 'Token Types', icon: Key, section: 'token-types' },
  {
    id: 'database',
    label: 'Database Tools',
    icon: Database,
    section: 'database',
    tools: [
      { name: 'nextmavens_query', desc: 'Query database with filters' },
      { name: 'nextmavens_insert', desc: 'Insert new records' },
      { name: 'nextmavens_update', desc: 'Update existing records' },
      { name: 'nextmavens_delete', desc: 'Delete records' },
    ]
  },
  {
    id: 'auth',
    label: 'Auth Tools',
    icon: Shield,
    section: 'auth',
    tools: [
      { name: 'nextmavens_signin', desc: 'Authenticate users' },
      { name: 'nextmavens_signup', desc: 'Register new users' },
    ]
  },
  {
    id: 'storage',
    label: 'Storage Tools',
    icon: HardDrive,
    section: 'storage',
    tools: [
      { name: 'nextmavens_file_info', desc: 'Get file metadata' },
      { name: 'nextmavens_file_download_url', desc: 'Generate download URLs' },
      { name: 'nextmavens_list_files', desc: 'List and filter files' },
    ]
  },
  {
    id: 'graphql',
    label: 'GraphQL Tools',
    icon: Code2,
    section: 'graphql',
    tools: [
      { name: 'nextmavens_graphql', desc: 'Execute GraphQL queries' },
      { name: 'nextmavens_graphql_introspect', desc: 'Explore database schema' },
    ]
  },
  { id: 'examples', label: 'Examples', icon: BookOpen, section: 'examples' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: Settings, section: 'troubleshooting' },
]

export const toolDetails: Record<string, ToolDetail> = {
  nextmavens_query: {
    description: 'Execute a database query on NextMavens. Supports SELECT operations with filters for complex queries.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to query' },
      { name: 'filters', type: 'array', required: false, description: 'Array of filter objects' },
      { name: 'limit', type: 'number', required: false, description: 'Maximum number of results' },
      { name: 'offset', type: 'number', required: false, description: 'Number of results to skip' },
      { name: 'orderBy', type: 'object', required: false, description: 'Order by column and direction' },
    ]
  },
  nextmavens_insert: {
    description: 'Insert a new row into a database table with the provided data.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to insert into' },
      { name: 'data', type: 'object', required: true, description: 'Data to insert as key-value pairs' },
    ]
  },
  nextmavens_update: {
    description: 'Update rows in a database table that match the given filters.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to update' },
      { name: 'data', type: 'object', required: true, description: 'Data to update as key-value pairs' },
      { name: 'filters', type: 'array', required: true, description: 'Filters to identify rows to update' },
    ]
  },
  nextmavens_delete: {
    description: 'Delete rows from a database table that match the given filters.',
    params: [
      { name: 'table', type: 'string', required: true, description: 'Table name to delete from' },
      { name: 'filters', type: 'array', required: true, description: 'Filters to identify rows to delete' },
    ]
  },
  nextmavens_signin: {
    description: 'Sign in a user with their email and password, returning JWT tokens.',
    params: [
      { name: 'email', type: 'string', required: true, description: 'User email address' },
      { name: 'password', type: 'string', required: true, description: 'User password' },
    ]
  },
  nextmavens_signup: {
    description: 'Register a new user with email, password, and optional metadata.',
    params: [
      { name: 'email', type: 'string', required: true, description: 'User email address' },
      { name: 'password', type: 'string', required: true, description: 'User password (min 8 characters)' },
      { name: 'name', type: 'string', required: false, description: 'User display name' },
      { name: 'tenantId', type: 'string', required: false, description: 'Tenant ID for multi-tenancy support' },
    ]
  },
  nextmavens_file_info: {
    description: 'Get detailed information about a file stored in NextMavens Storage.',
    params: [
      { name: 'fileId', type: 'string', required: true, description: 'File ID from storage' },
    ]
  },
  nextmavens_file_download_url: {
    description: 'Generate a temporary download URL for a file.',
    params: [
      { name: 'fileId', type: 'string', required: true, description: 'File ID from storage' },
    ]
  },
  nextmavens_list_files: {
    description: 'List files with optional filtering by tenant, file type, and pagination.',
    params: [
      { name: 'tenantId', type: 'string', required: false, description: 'Filter by tenant ID' },
      { name: 'fileType', type: 'string', required: false, description: 'Filter by file type' },
      { name: 'limit', type: 'number', required: false, description: 'Maximum results to return' },
      { name: 'offset', type: 'number', required: false, description: 'Number of results to skip' },
    ]
  },
  nextmavens_graphql: {
    description: 'Execute a GraphQL query against your NextMavens GraphQL endpoint.',
    params: [
      { name: 'query', type: 'string', required: true, description: 'GraphQL query string' },
      { name: 'variables', type: 'object', required: false, description: 'GraphQL variables object' },
    ]
  },
  nextmavens_graphql_introspect: {
    description: 'Get GraphQL schema introspection data for exploring available types, fields, and operations.',
    params: []
  },
}
