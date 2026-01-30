/**
 * Storage Path Scoping Middleware
 *
 * Middleware for scoping storage paths to project-specific prefixes.
 * Enforces project isolation by ensuring file paths follow the pattern: project_id:/path
 *
 * US-004: Prefix Storage Paths (prd-resource-isolation.json)
 *
 * @example
 * ```typescript
 * import { validateStoragePath, buildStoragePath } from '@/lib/middleware/storage-scope';
 *
 * // In a file upload handler
 * export async function handleUpload(req: NextRequest, path: string) {
 *   const projectId = getProjectIdFromRequest(req);
 *   validateStoragePath(path, projectId);
 *   // Proceed with upload
 * }
 *
 * // Building a properly scoped path
 * const scopedPath = buildStoragePath(projectId, '/uploads/image.png');
 * // Returns: 'abc-123:/uploads/image.png'
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { JwtPayload } from '@/lib/auth';

/**
 * Error codes for storage path scoping
 */
export enum StorageScopeError {
  MISSING_PROJECT_ID = 'MISSING_PROJECT_ID',
  INVALID_PATH_FORMAT = 'INVALID_PATH_FORMAT',
  CROSS_PROJECT_PATH = 'CROSS_PROJECT_PATH',
  PATH_TRAVERSAL_DETECTED = 'PATH_TRAVERSAL_DETECTED',
  INVALID_PATH_CHARACTER = 'INVALID_PATH_CHARACTER',
}

/**
 * Maximum path length (excluding project_id prefix)
 */
const MAX_PATH_LENGTH = 500;

/**
 * Pattern for validating storage paths
 * Format: project_id:/path or project_id:path
 * The path must start with / after the project_id
 */
const PATH_PATTERN = /^([a-f0-9-]+):(\/.*)$/;

/**
 * Characters that are not allowed in storage paths
 * Prevents path traversal and other attacks
 */
const INVALID_CHARS = ['\0', '..', '<', '>', ':', '|', '?', '*'];

/**
 * Reserved path names that cannot be used
 */
const RESERVED_PATHS = [
  'system',
  'admin',
  'auth',
  'control',
  'internal',
  'global',
  'all',
  '*',
  '.',
  '',
];

/**
 * Validate that a storage path follows the expected format
 *
 * Format: project_id:/path
 *
 * @param path - The storage path to validate
 * @returns Parsed path parts if valid
 * @throws Error if format is invalid
 */
export function validateStoragePathFormat(path: string): {
  projectId: string;
  storagePath: string;
} {
  if (!path || typeof path !== 'string') {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  // Check total length
  if (path.length > 600) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  // Parse the path
  const match = path.match(PATH_PATTERN);
  if (!match) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  const [, projectId, storagePath] = match;

  // Validate project_id is a valid UUID
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(projectId)) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  // Validate storage path length
  if (storagePath.length > MAX_PATH_LENGTH) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  // Check for path traversal attempts
  if (storagePath.includes('..') || storagePath.includes('\\')) {
    throw new Error(StorageScopeError.PATH_TRAVERSAL_DETECTED);
  }

  // Check for invalid characters
  for (const char of INVALID_CHARS) {
    if (storagePath.includes(char)) {
      throw new Error(StorageScopeError.INVALID_PATH_CHARACTER);
    }
  }

  // Extract the path after the leading slash
  const pathWithoutPrefix = storagePath.substring(1);

  // Check for reserved path names
  const segments = pathWithoutPrefix.split('/').filter(s => s.length > 0);
  for (const segment of segments) {
    if (RESERVED_PATHS.includes(segment.toLowerCase())) {
      throw new Error(StorageScopeError.INVALID_PATH_CHARACTER);
    }
  }

  return {
    projectId,
    storagePath,
  };
}

/**
 * Validate that a storage path is scoped to the correct project
 *
 * Ensures that a request with project_id can only access paths
 * prefixed with that same project_id. Returns 403 for cross-project access.
 *
 * @param path - The storage path to validate
 * @param projectId - The project_id from JWT
 * @throws Error if cross-project access detected
 *
 * @example
 * ```typescript
 * try {
 *   validateStoragePath('abc-123:/uploads/image.png', 'abc-123');
 *   // Allow access
 * } catch (error) {
 *   // Return 403 to client
 * }
 * ```
 */
export function validateStoragePath(path: string, projectId: string): void {
  if (!projectId) {
    throw new Error(StorageScopeError.MISSING_PROJECT_ID);
  }

  // Parse and validate path format
  const parsed = validateStoragePathFormat(path);

  // Check if path belongs to the project
  if (parsed.projectId !== projectId) {
    throw new Error(StorageScopeError.CROSS_PROJECT_PATH);
  }
}

/**
 * Build a properly prefixed storage path for a project
 *
 * @param projectId - The project ID
 * @param storagePath - The storage path (must start with /)
 * @returns A properly formatted storage path
 *
 * @example
 * ```typescript
 * const path1 = buildStoragePath('abc-123', '/uploads/image.png');
 * // Returns: 'abc-123:/uploads/image.png'
 *
 * const path2 = buildStoragePath('abc-123', '/documents/report.pdf');
 * // Returns: 'abc-123:/documents/report.pdf'
 * ```
 */
export function buildStoragePath(projectId: string, storagePath: string): string {
  if (!projectId) {
    throw new Error(StorageScopeError.MISSING_PROJECT_ID);
  }

  if (!storagePath || typeof storagePath !== 'string') {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  // Ensure path starts with /
  if (!storagePath.startsWith('/')) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  // Validate the path
  const validation = validateStoragePathFormat(`${projectId}:${storagePath}`);
  if (validation.projectId !== projectId) {
    throw new Error(StorageScopeError.INVALID_PATH_FORMAT);
  }

  return `${projectId}:${storagePath}`;
}

/**
 * Extract project ID from a storage path
 *
 * @param path - The storage path
 * @returns The project ID or null if invalid
 *
 * @example
 * ```typescript
 * const projectId = extractProjectIdFromPath('abc-123:/uploads/image.png');
 * // Returns: 'abc-123'
 * ```
 */
export function extractProjectIdFromPath(path: string): string | null {
  try {
    const parsed = validateStoragePathFormat(path);
    return parsed.projectId;
  } catch {
    return null;
  }
}

/**
 * Extract the storage path (without project_id prefix) from a full path
 *
 * @param path - The full storage path with project_id prefix
 * @returns The storage path without project_id prefix, or null if invalid
 *
 * @example
 * ```typescript
 * const storagePath = extractStoragePath('abc-123:/uploads/image.png');
 * // Returns: '/uploads/image.png'
 * ```
 */
export function extractStoragePath(path: string): string | null {
  try {
    const parsed = validateStoragePathFormat(path);
    return parsed.storagePath;
  } catch {
    return null;
  }
}

/**
 * Handle a file upload request with path validation
 *
 * Validates that the storage path is properly scoped and returns
 * an error if cross-project access is attempted.
 *
 * @param req - Next.js request
 * @param path - Storage path for the file
 * @param auth - JWT payload
 * @returns Response indicating success or failure
 */
export function handleFileUpload(
  req: NextRequest,
  path: string,
  auth: JwtPayload
): NextResponse {
  try {
    // Validate path is scoped to the project
    validateStoragePath(path, auth.project_id);

    const parsed = validateStoragePathFormat(path);

    return NextResponse.json({
      status: 'ready',
      path: path,
      storage_path: parsed.storagePath,
      project_id: auth.project_id,
    });
  } catch (error: any) {
    // Return 403 for cross-project access attempts
    if (error.message === StorageScopeError.CROSS_PROJECT_PATH) {
      return NextResponse.json(
        {
          error: 'Cross-project path access denied',
          message: 'Access to other project files not permitted',
          code: StorageScopeError.CROSS_PROJECT_PATH,
        },
        { status: 403 }
      );
    }

    if (error.message === StorageScopeError.MISSING_PROJECT_ID) {
      return NextResponse.json(
        {
          error: 'Missing project ID',
          message: 'Project ID is required for file operations',
          code: StorageScopeError.MISSING_PROJECT_ID,
        },
        { status: 401 }
      );
    }

    if (error.message === StorageScopeError.PATH_TRAVERSAL_DETECTED) {
      return NextResponse.json(
        {
          error: 'Path traversal detected',
          message: 'Invalid file path detected',
          code: StorageScopeError.PATH_TRAVERSAL_DETECTED,
        },
        { status: 400 }
      );
    }

    // Other errors
    return NextResponse.json(
      {
        error: 'Invalid storage path',
        message: error.message || 'Path validation failed',
        code: error.message || StorageScopeError.INVALID_PATH_FORMAT,
      },
      { status: 400 }
    );
  }
}

/**
 * Handle a file download request with path validation
 *
 * Validates that the storage path is properly scoped and returns
 * an error if cross-project access is attempted.
 *
 * @param req - Next.js request
 * @param path - Storage path for the file
 * @param auth - JWT payload
 * @returns Response indicating success or failure
 */
export function handleFileDownload(
  req: NextRequest,
  path: string,
  auth: JwtPayload
): NextResponse {
  // Use the same validation as upload
  return handleFileUpload(req, path, auth);
}

/**
 * Check if a path is a system/global path (not project-scoped)
 *
 * System paths are used for platform-wide files and are not
 * tied to a specific project.
 *
 * @param path - The storage path
 * @returns True if the path is a system path
 */
export function isSystemPath(path: string): boolean {
  // System paths don't have a project_id prefix
  // They start with a reserved keyword
  const systemPrefixes = ['system:', 'global:', 'admin:', 'internal:'];
  return systemPrefixes.some(prefix => path.startsWith(prefix));
}

/**
 * Generate example storage paths for a project
 *
 * Returns a list of example storage paths for documentation and testing.
 *
 * @param projectId - The project ID
 * @returns Array of example storage paths
 */
export function generateExamplePaths(projectId: string): string[] {
  return [
    buildStoragePath(projectId, '/uploads/image.png'),
    buildStoragePath(projectId, '/documents/report.pdf'),
    buildStoragePath(projectId, '/assets/logo.svg'),
    buildStoragePath(projectId, '/backups/database.sql'),
    buildStoragePath(projectId, '/logs/app.log'),
  ];
}

/**
 * Type for a storage file reference
 */
export interface StorageFile {
  path: string;
  projectId: string;
  storagePath: string;
  size?: number;
  contentType?: string;
  createdAt?: Date;
}

/**
 * Create a storage file reference with proper path scoping
 *
 * @param projectId - The project ID
 * @param storagePath - The storage path
 * @param metadata - Optional file metadata
 * @returns A storage file reference
 */
export function createStorageFile(
  projectId: string,
  storagePath: string,
  metadata?: { size?: number; contentType?: string }
): StorageFile {
  const fullPath = buildStoragePath(projectId, storagePath);

  return {
    path: fullPath,
    projectId,
    storagePath,
    size: metadata?.size,
    contentType: metadata?.contentType,
    createdAt: new Date(),
  };
}

export default {
  validateStoragePathFormat,
  validateStoragePath,
  buildStoragePath,
  extractProjectIdFromPath,
  extractStoragePath,
  handleFileUpload,
  handleFileDownload,
  isSystemPath,
  generateExamplePaths,
  createStorageFile,
  StorageScopeError,
};
