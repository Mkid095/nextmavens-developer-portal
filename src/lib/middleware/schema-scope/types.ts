/**
 * Schema Scope Middleware - Type Definitions
 *
 * US-002: Scope Database Queries
 */

import type { Pool, PoolClient } from 'pg'

/**
 * Error codes for schema scoping
 */
export enum SchemaScopeError {
  MISSING_PROJECT_ID = 'MISSING_PROJECT_ID',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  CROSS_SCHEMA_ACCESS = 'CROSS_SCHEMA_ACCESS',
  SCHEMA_INIT_FAILED = 'SCHEMA_INIT_FAILED',
}

/**
 * Schema-scoped pool wrapper
 * Extends Pool to include schema metadata
 */
export interface ScopedPool extends Pool {
  schemaName: string;
  projectId: string;
  tenantSlug: string;
}

/**
 * Schema-scoped client wrapper
 * Extends PoolClient to include schema metadata
 */
export interface ScopedClient extends PoolClient {
  schemaName: string;
  projectId: string;
  tenantSlug: string;
}

/**
 * Cache entry with timestamp
 */
export interface CacheEntry {
  slug: string;
  timestamp: number;
}

/**
 * Cache TTL in milliseconds (5 minutes)
 */
export const CACHE_TTL = 5 * 60 * 1000;

/**
 * Type augmentation for Pool to include scope metadata
 */
declare module 'pg' {
  interface Pool {
    schemaName?: string;
    projectId?: string;
    tenantSlug?: string;
  }

  interface PoolClient {
    schemaName?: string;
    projectId?: string;
    tenantSlug?: string;
  }
}
